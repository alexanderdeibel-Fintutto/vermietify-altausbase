import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function SubmissionComparisonDialog({ 
  submission1, 
  submission2, 
  open, 
  onOpenChange 
}) {
  if (!submission1 || !submission2) return null;

  const compareFields = (field) => {
    const val1 = submission1.form_data?.[field] || 0;
    const val2 = submission2.form_data?.[field] || 0;
    const diff = val2 - val1;
    const percentChange = val1 !== 0 ? ((diff / val1) * 100).toFixed(1) : 0;

    return { val1, val2, diff, percentChange };
  };

  const fields = [
    { key: 'income_rent', label: 'Mieteinnahmen' },
    { key: 'expense_property_tax', label: 'Grundsteuer' },
    { key: 'expense_insurance', label: 'Versicherungen' },
    { key: 'expense_maintenance', label: 'Instandhaltung' },
    { key: 'expense_administration', label: 'Verwaltung' },
    { key: 'expense_interest', label: 'Zinsen' },
    { key: 'afa_amount', label: 'AfA' }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Submissions-Vergleich</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 border rounded-lg">
            <Badge variant="outline" className="mb-2">{submission1.tax_year}</Badge>
            <div className="text-sm text-slate-600">
              {format(new Date(submission1.created_date), 'dd.MM.yyyy', { locale: de })}
            </div>
            <Badge className="mt-2">{submission1.status}</Badge>
          </div>

          <div className="p-4 border rounded-lg">
            <Badge variant="outline" className="mb-2">{submission2.tax_year}</Badge>
            <div className="text-sm text-slate-600">
              {format(new Date(submission2.created_date), 'dd.MM.yyyy', { locale: de })}
            </div>
            <Badge className="mt-2">{submission2.status}</Badge>
          </div>
        </div>

        <div className="space-y-3">
          {fields.map(field => {
            const comparison = compareFields(field.key);
            const Icon = comparison.diff > 0 ? TrendingUp : comparison.diff < 0 ? TrendingDown : Minus;
            const color = comparison.diff > 0 ? 'text-green-600' : comparison.diff < 0 ? 'text-red-600' : 'text-slate-600';

            return (
              <div key={field.key} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{field.label}</span>
                  {comparison.diff !== 0 && (
                    <Badge variant="outline" className={`${color} flex items-center gap-1`}>
                      <Icon className="w-3 h-3" />
                      {comparison.percentChange}%
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-mono">
                    {comparison.val1.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                  <span className="font-mono font-medium">
                    {comparison.val2.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  </span>
                </div>
                {comparison.diff !== 0 && (
                  <div className={`text-xs mt-1 ${color}`}>
                    {comparison.diff > 0 ? '+' : ''}{comparison.diff.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <Alert className="mt-4">
          <AlertDescription>
            <strong>Hinweis:</strong> Dieser Vergleich zeigt nur die Kerndaten. Detaillierte Unterschiede 
            finden Sie in den jeweiligen Formularen.
          </AlertDescription>
        </Alert>
      </DialogContent>
    </Dialog>
  );
}