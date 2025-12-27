import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Upload, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { parseCSV, detectBankFormat } from '@/components/banking/csvParser';
import { autoMatchAllTransactions } from '@/components/banking/matchTransactions';

export default function TransactionImporter({ open, onOpenChange, accounts = [] }) {
    const [file, setFile] = useState(null);
    const [selectedAccount, setSelectedAccount] = useState('');
    const [parsedData, setParsedData] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const queryClient = useQueryClient();

    const handleFileChange = async (e) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        if (!selectedFile.name.endsWith('.csv')) {
            toast.error('Bitte wählen Sie eine CSV-Datei aus');
            return;
        }

        setFile(selectedFile);
        setIsProcessing(true);

        try {
            const text = await selectedFile.text();
            const format = detectBankFormat(text);
            const transactions = parseCSV(text, format);
            
            setParsedData({
                format,
                transactions,
                count: transactions.length
            });

            toast.success(`${transactions.length} Transaktionen erkannt (${format})`);
        } catch (error) {
            toast.error('Fehler beim Lesen der Datei: ' + error.message);
            setFile(null);
            setParsedData(null);
        } finally {
            setIsProcessing(false);
        }
    };

    const importMutation = useMutation({
        mutationFn: async () => {
            if (!parsedData || !selectedAccount) {
                throw new Error('Bitte wählen Sie ein Konto und eine Datei aus');
            }

            const transactionsToCreate = parsedData.transactions.map(t => ({
                ...t,
                account_id: selectedAccount,
                is_matched: false
            }));

            // Check for duplicates
            const existingTransactions = await base44.entities.BankTransaction.filter({
                account_id: selectedAccount
            });

            const uniqueTransactions = transactionsToCreate.filter(newTrans => {
                return !existingTransactions.some(existing => 
                    existing.transaction_date === newTrans.transaction_date &&
                    Math.abs(existing.amount - newTrans.amount) < 0.01 &&
                    existing.reference === newTrans.reference
                );
            });

            if (uniqueTransactions.length === 0) {
                throw new Error('Alle Transaktionen existieren bereits');
            }

            await base44.entities.BankTransaction.bulkCreate(uniqueTransactions);
            
            // Auto-match after import
            const matchedCount = await autoMatchAllTransactions();

            return { 
                imported: uniqueTransactions.length, 
                matched: matchedCount,
                duplicates: transactionsToCreate.length - uniqueTransactions.length
            };
        },
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
            queryClient.invalidateQueries({ queryKey: ['payments'] });
            
            let message = `${result.imported} Transaktionen importiert`;
            if (result.duplicates > 0) {
                message += `, ${result.duplicates} Duplikate übersprungen`;
            }
            if (result.matched > 0) {
                message += `, ${result.matched} automatisch abgeglichen`;
            }
            
            toast.success(message);
            handleClose();
        },
        onError: (error) => {
            toast.error(error.message || 'Fehler beim Importieren');
        }
    });

    const handleClose = () => {
        setFile(null);
        setParsedData(null);
        setSelectedAccount('');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Transaktionen importieren</DialogTitle>
                    <DialogDescription>
                        Laden Sie eine CSV-Datei von Ihrer Bank hoch. Unterstützte Formate: Sparkasse, Volksbank, Deutsche Bank, ING, Commerzbank.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Account Selection */}
                    <div className="space-y-2">
                        <Label>Bankkonto auswählen</Label>
                        <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                            <SelectTrigger>
                                <SelectValue placeholder="Konto auswählen..." />
                            </SelectTrigger>
                            <SelectContent>
                                {accounts.map(account => (
                                    <SelectItem key={account.id} value={account.id}>
                                        {account.name} ({account.iban})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* File Upload */}
                    <div className="space-y-2">
                        <Label htmlFor="csv-file">CSV-Datei hochladen</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                id="csv-file"
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                disabled={isProcessing}
                            />
                        </div>
                    </div>

                    {/* Preview */}
                    {parsedData && (
                        <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
                            <div className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-800">
                                        Datei erfolgreich analysiert
                                    </p>
                                    <p className="text-xs text-slate-600 mt-1">
                                        Format: {parsedData.format}
                                    </p>
                                    <p className="text-xs text-slate-600">
                                        {parsedData.count} Transaktionen gefunden
                                    </p>
                                    
                                    {parsedData.transactions.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-slate-200">
                                            <p className="text-xs font-medium text-slate-600 mb-2">
                                                Beispiel:
                                            </p>
                                            <div className="text-xs space-y-1 text-slate-700">
                                                <p>Datum: {parsedData.transactions[0].transaction_date}</p>
                                                <p>Betrag: €{parsedData.transactions[0].amount}</p>
                                                <p>Beschreibung: {parsedData.transactions[0].description}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {file && !parsedData && !isProcessing && (
                        <div className="rounded-lg border border-amber-200 p-4 bg-amber-50">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-amber-800">
                                        Format nicht erkannt
                                    </p>
                                    <p className="text-xs text-amber-700 mt-1">
                                        Bitte stellen Sie sicher, dass Sie eine CSV-Datei einer unterstützten Bank verwenden.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        Abbrechen
                    </Button>
                    <Button 
                        onClick={() => importMutation.mutate()}
                        disabled={!parsedData || !selectedAccount || importMutation.isPending}
                        className="bg-emerald-600 hover:bg-emerald-700"
                    >
                        {importMutation.isPending ? (
                            <>Importiere...</>
                        ) : (
                            <>
                                <Upload className="w-4 h-4 mr-2" />
                                Importieren
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}