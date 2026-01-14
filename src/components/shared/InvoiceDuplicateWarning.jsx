import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function InvoiceDuplicateWarning({ amount, recipient, invoiceDate, excludeId }) {
  const [duplicates, setDuplicates] = useState([]);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!amount || !recipient || amount <= 0) {
      setDuplicates([]);
      return;
    }

    const checkDuplicates = async () => {
      setChecking(true);
      try {
        const allInvoices = await base44.entities.Invoice.list(null, 500);
        
        // Find potential duplicates: same amount ±1€, same recipient, within ±30 days
        const dateThreshold = 30 * 24 * 60 * 60 * 1000; // 30 days in ms
        const invoiceDateMs = new Date(invoiceDate).getTime();
        
        const potentialDuplicates = allInvoices.filter(inv => {
          if (excludeId && inv.id === excludeId) return false;
          
          const amountMatch = Math.abs(inv.amount - amount) <= 1;
          const recipientMatch = inv.recipient?.toLowerCase().includes(recipient.toLowerCase()) ||
                                recipient.toLowerCase().includes(inv.recipient?.toLowerCase());
          
          const dateDiff = Math.abs(new Date(inv.invoice_date).getTime() - invoiceDateMs);
          const dateMatch = dateDiff <= dateThreshold;
          
          return amountMatch && recipientMatch && dateMatch;
        });
        
        setDuplicates(potentialDuplicates);
      } catch (error) {
        console.error('Duplicate check failed:', error);
      } finally {
        setChecking(false);
      }
    };

    const debounce = setTimeout(checkDuplicates, 500);
    return () => clearTimeout(debounce);
  }, [amount, recipient, invoiceDate, excludeId]);

  if (checking || duplicates.length === 0) return null;

  return (
    <Alert className="border-amber-500 bg-amber-50">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-amber-900">
        <p className="font-semibold mb-2">⚠️ Mögliche Duplikate gefunden ({duplicates.length})</p>
        <div className="space-y-2 mb-3">
          {duplicates.slice(0, 3).map(dup => (
            <div key={dup.id} className="text-sm flex items-center justify-between bg-white p-2 rounded border border-amber-200">
              <div>
                <span className="font-medium">{dup.recipient}</span>
                <span className="text-slate-600 ml-2">€{dup.amount?.toFixed(2)}</span>
                <span className="text-slate-500 ml-2">{format(new Date(dup.invoice_date), 'dd.MM.yyyy', { locale: de })}</span>
              </div>
              <a href={createPageUrl('Invoices') + '?id=' + dup.id} target="_blank">
                <Button variant="ghost" size="sm" className="gap-1">
                  <ExternalLink className="w-3 h-3" />
                  Ansehen
                </Button>
              </a>
            </div>
          ))}
        </div>
        <p className="text-xs text-amber-700">
          Bitte prüfen Sie, ob diese Rechnung bereits erfasst wurde.
        </p>
      </AlertDescription>
    </Alert>
  );
}