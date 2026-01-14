import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function BatchMatchButton({ transactions, invoices }) {
  const [processing, setProcessing] = useState(false);
  const [matches, setMatches] = useState([]);
  const queryClient = useQueryClient();

  // Find potential matches for all transactions
  const findMatches = () => {
    const potentialMatches = [];
    
    transactions.forEach(transaction => {
      if (transaction.matched_invoice_id) return; // Skip already matched
      
      const candidates = invoices.filter(invoice => {
        const amountMatch = Math.abs(invoice.amount - Math.abs(transaction.amount)) < 5;
        const dateMatch = true; // Could add date logic
        const nameMatch = invoice.recipient && transaction.recipient_name && 
          (invoice.recipient.toLowerCase().includes(transaction.recipient_name.toLowerCase()) ||
           transaction.recipient_name.toLowerCase().includes(invoice.recipient.toLowerCase()));
        
        return amountMatch && (nameMatch || dateMatch);
      });

      if (candidates.length > 0) {
        potentialMatches.push({
          transaction,
          invoice: candidates[0],
          confidence: nameMatch ? 95 : 75
        });
      }
    });

    return potentialMatches;
  };

  const potentialMatches = findMatches();

  const handleBatchAccept = async () => {
    setProcessing(true);
    try {
      for (const match of potentialMatches) {
        await base44.entities.BankTransaction.update(match.transaction.id, {
          matched_invoice_id: match.invoice.id
        });
      }
      queryClient.invalidateQueries({ queryKey: ['bank_transfers'] });
      toast.success(`${potentialMatches.length} Verknüpfungen erstellt`);
    } catch (error) {
      toast.error('Fehler beim Verknüpfen');
    } finally {
      setProcessing(false);
    }
  };

  if (potentialMatches.length === 0) return null;

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <div>
            <p className="font-medium text-blue-900">
              {potentialMatches.length} automatische Übereinstimmungen gefunden
            </p>
            <p className="text-xs text-blue-700">
              Basierend auf Betrag, Datum und Empfänger
            </p>
          </div>
        </div>
        <Button 
          onClick={handleBatchAccept}
          disabled={processing}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {processing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verknüpfe...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Alle übernehmen
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}