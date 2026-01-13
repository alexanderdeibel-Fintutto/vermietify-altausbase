import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';

export default function BankTransactionMatcher({ transaction, invoices, onMatch, onIgnore }) {
  if (!transaction || !invoices.length) return null;

  // Automatische Matching-Vorschläge (Betrag ±5%, Datum ±7 Tage)
  const suggestions = React.useMemo(() => {
    return invoices
      .filter(inv => {
        const amountDiff = Math.abs(inv.amount - transaction.amount) / transaction.amount;
        const dateDiff = Math.abs(
          new Date(inv.invoice_date) - new Date(transaction.date)
        ) / (1000 * 60 * 60 * 24);
        return amountDiff <= 0.05 && dateDiff <= 7;
      })
      .sort((a, b) => {
        const amountMatch = Math.abs(a.amount - transaction.amount);
        const dateMatch = Math.abs(
          new Date(a.invoice_date) - new Date(transaction.date)
        );
        return amountMatch + dateMatch - (Math.abs(b.amount - transaction.amount) + Math.abs(
          new Date(b.invoice_date) - new Date(transaction.date)
        ));
      })
      .slice(0, 3);
  }, [transaction, invoices]);

  if (suggestions.length === 0) return null;

  return (
    <Card className="p-4 bg-emerald-50 border-emerald-200 space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-medium text-sm">💡 Mögliche Zuordnungen gefunden</p>
        <Button size="sm" variant="ghost" onClick={onIgnore}>
          <X className="w-3 h-3" />
        </Button>
      </div>

      <div className="space-y-2">
        {suggestions.map(inv => (
          <div key={inv.id} className="flex items-center justify-between p-2 bg-white rounded border border-emerald-200">
            <div className="flex-1">
              <p className="text-sm font-medium">{inv.description}</p>
              <p className="text-xs text-slate-600">{inv.recipient} · €{inv.amount}</p>
            </div>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 gap-1"
              onClick={() => onMatch(inv.id)}
            >
              <Check className="w-3 h-3" />
              Zuordnen
            </Button>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-600">
        {suggestions.length === 1 
          ? 'Eine mögliche Zuordnung gefunden'
          : `${suggestions.length} mögliche Zuordnungen gefunden`
        }
      </p>
    </Card>
  );
}