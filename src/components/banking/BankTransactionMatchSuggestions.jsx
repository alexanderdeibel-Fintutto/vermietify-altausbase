import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BankTransactionMatchSuggestions({
  transaction,
  invoices = [],
  contracts = [],
  onMatch,
}) {
  const suggestions = useMemo(() => {
    const matches = [];

    // Check against invoices
    invoices.forEach((invoice) => {
      const amountMatch = Math.abs(
        transaction.amount - invoice.amount
      ) <= invoice.amount * 0.05; // ±5%
      const dateMatch =
        Math.abs(
          new Date(transaction.date).getTime() - new Date(invoice.invoice_date).getTime()
        ) <= 7 * 24 * 60 * 60 * 1000; // ±7 days

      if (amountMatch && dateMatch) {
        matches.push({
          type: 'invoice',
          entity: invoice,
          confidence: amountMatch && dateMatch ? 95 : 70,
        });
      }
    });

    // Check against rental payments (contracts)
    contracts.forEach((contract) => {
      const amountMatch = Math.abs(
        transaction.amount - contract.rent_amount
      ) <= contract.rent_amount * 0.05;
      const dateMatch =
        Math.abs(
          new Date(transaction.date).getTime() - new Date(contract.start_date).getTime()
        ) <= 7 * 24 * 60 * 60 * 1000;

      if (amountMatch && dateMatch) {
        matches.push({
          type: 'contract',
          entity: contract,
          confidence: amountMatch && dateMatch ? 90 : 60,
        });
      }
    });

    return matches.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
  }, [transaction, invoices, contracts]);

  if (suggestions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      <p className="text-xs font-medium text-slate-700">🔍 Mögliche Zuordnungen:</p>
      {suggestions.map((suggestion, idx) => (
        <Card
          key={idx}
          className="p-3 border-blue-200 bg-blue-50 hover:border-blue-400 transition-colors"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900">
                {suggestion.type === 'invoice'
                  ? suggestion.entity.recipient
                  : `Miete - ${suggestion.entity.tenant_name}`}
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                {suggestion.entity.amount || suggestion.entity.rent_amount}€ |{' '}
                {suggestion.entity.invoice_date || suggestion.entity.start_date}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant="outline" className="bg-white">
                {suggestion.confidence}%
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onMatch(suggestion)}
                className="h-7 p-1 text-blue-600 hover:text-blue-700"
              >
                <CheckCircle2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </motion.div>
  );
}