import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { VfProgress } from '@/components/shared/VfProgress';
import CurrencyDisplay from '@/components/shared/CurrencyDisplay';

export default function ROIDashboard() {
  const roi = {
    current: 8.5,
    target: 10,
    annualIncome: 48000,
    annualExpenses: 12000,
    netIncome: 36000
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Rendite-Übersicht
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-6">
          <div className="text-5xl font-bold text-[var(--theme-primary)] mb-2">
            {roi.current}%
          </div>
          <div className="text-sm text-[var(--theme-text-muted)]">Aktuelle Rendite</div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm">Ziel-Rendite</span>
            <span className="text-sm font-bold">{roi.target}%</span>
          </div>
          <VfProgress value={(roi.current / roi.target) * 100} variant="success" />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-[var(--theme-text-secondary)]">Jährliche Einnahmen</span>
            <CurrencyDisplay amount={roi.annualIncome} colored />
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-[var(--theme-text-secondary)]">Jährliche Ausgaben</span>
            <CurrencyDisplay amount={roi.annualExpenses} colored />
          </div>
          <div className="pt-2 border-t border-[var(--theme-border)]">
            <div className="flex justify-between">
              <span className="font-semibold">Netto-Einkommen</span>
              <CurrencyDisplay amount={roi.netIncome} colored className="font-bold" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}