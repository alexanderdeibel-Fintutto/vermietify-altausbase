import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { RefreshCw, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { parseCSV, detectBankFormat } from './csvParser';
import { categorizeTransaction } from './categorizeTransaction';
import { autoMatchAllTransactions } from './matchTransactions';

// Simulierte Online-Banking-Verbindung (Demo)
const simulateOnlineBanking = async (account) => {
    // In Produktion würde hier eine echte Banking-API-Verbindung stattfinden
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simuliere Beispiel-Transaktionen
    const mockTransactions = [
        {
            transaction_date: new Date().toISOString().split('T')[0],
            value_date: new Date().toISOString().split('T')[0],
            amount: 750.00,
            description: 'Mietzahlung',
            sender_receiver: 'Max Mustermann',
            reference: 'Miete Dezember',
            iban: 'DE89370400440532013000'
        }
    ];
    
    return mockTransactions;
};

export default function OnlineBankingSync({ account, onSyncComplete }) {
    const [isSyncing, setIsSyncing] = useState(false);
    const queryClient = useQueryClient();

    const syncMutation = useMutation({
        mutationFn: async () => {
            if (!account.online_banking_enabled) {
                throw new Error('Online-Banking ist nicht aktiviert');
            }

            if (!account.banking_password_encrypted) {
                throw new Error('Keine Zugangsdaten hinterlegt');
            }

            // Simuliere Banking-Verbindung
            const transactions = await simulateOnlineBanking(account);

            // Lade Kategorien für Auto-Kategorisierung
            const categories = await base44.entities.TransactionCategory.list();

            // Prüfe auf Duplikate
            const existingTransactions = await base44.entities.BankTransaction.filter({
                account_id: account.id
            });

            const uniqueTransactions = transactions.filter(newTrans => {
                return !existingTransactions.some(existing => 
                    existing.transaction_date === newTrans.transaction_date &&
                    Math.abs(existing.amount - newTrans.amount) < 0.01 &&
                    existing.reference === newTrans.reference
                );
            });

            if (uniqueTransactions.length === 0) {
                return { imported: 0, matched: 0, message: 'Keine neuen Transaktionen' };
            }

            // Erstelle Transaktionen mit Auto-Kategorisierung
            const transactionsToCreate = uniqueTransactions.map(t => {
                const categoryId = categorizeTransaction(t, categories);
                return {
                    ...t,
                    account_id: account.id,
                    is_matched: false,
                    category_id: categoryId
                };
            });

            await base44.entities.BankTransaction.bulkCreate(transactionsToCreate);

            // Update Last Sync Date
            await base44.entities.BankAccount.update(account.id, {
                last_sync_date: new Date().toISOString()
            });

            // Auto-Match
            const matchedCount = await autoMatchAllTransactions();

            return { 
                imported: uniqueTransactions.length, 
                matched: matchedCount,
                message: 'Synchronisation erfolgreich'
            };
        },
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
            queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
            queryClient.invalidateQueries({ queryKey: ['payments'] });
            
            toast.success(
                `${result.imported} Transaktionen importiert, ${result.matched} abgeglichen`
            );
            
            if (onSyncComplete) onSyncComplete(result);
        },
        onError: (error) => {
            toast.error('Fehler bei Synchronisation: ' + error.message);
        }
    });

    const handleSync = () => {
        setIsSyncing(true);
        syncMutation.mutate();
    };

    React.useEffect(() => {
        if (!syncMutation.isPending) {
            setIsSyncing(false);
        }
    }, [syncMutation.isPending]);

    return (
        <Button
            onClick={handleSync}
            disabled={isSyncing || !account.online_banking_enabled}
            size="sm"
            variant="outline"
            className="gap-2"
        >
            {isSyncing ? (
                <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Synchronisiere...
                </>
            ) : (
                <>
                    <Download className="w-4 h-4" />
                    Jetzt synchronisieren
                </>
            )}
        </Button>
    );
}