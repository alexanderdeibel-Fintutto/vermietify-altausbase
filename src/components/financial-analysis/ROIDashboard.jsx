import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import PercentageDisplay from '@/components/shared/PercentageDisplay';

export default function ROIDashboard({ building }) {
  const purchasePrice = building?.purchase_price || 320000;
  const annualRent = 18000;
  const annualExpenses = 6500;
  const netIncome = annualRent - annualExpenses;
  const roi = (netIncome / purchasePrice) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Rendite (ROI)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-6">
          <PercentageDisplay value={roi} className="text-4xl font-bold text-[var(--vf-success-600)]" />
          <div className="text-sm text-[var(--theme-text-muted)] mt-2">Jährliche Rendite</div>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between p-2 bg-[var(--theme-surface)] rounded">
            <span className="text-[var(--theme-text-muted)]">Jahresmiete</span>
            <span className="font-semibold">€{annualRent.toLocaleString()}</span>
          </div>
          <div className="flex justify-between p-2 bg-[var(--theme-surface)] rounded">
            <span className="text-[var(--theme-text-muted)]">Ausgaben</span>
            <span className="font-semibold">€{annualExpenses.toLocaleString()}</span>
          </div>
          <div className="flex justify-between p-2 bg-[var(--vf-success-50)] rounded">
            <span className="font-medium">Netto-Einnahmen</span>
            <span className="font-bold text-[var(--vf-success-600)]">€{netIncome.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}