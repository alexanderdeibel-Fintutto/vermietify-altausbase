import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import SimpleLineChart from '@/components/charts/SimpleLineChart';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function CashflowForecast({ months = 6 }) {
  const data = Array.from({ length: months }, (_, i) => ({
    name: new Date(2026, i, 1).toLocaleDateString('de-DE', { month: 'short' }),
    Einnahmen: 15000 + Math.random() * 5000,
    Ausgaben: 8000 + Math.random() * 3000
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Cashflow-Prognose
        </CardTitle>
      </CardHeader>
      <CardContent>
        <SimpleLineChart data={data} height={250} />
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="text-center p-3 bg-[var(--vf-success-50)] rounded-lg">
            <div className="text-xs text-[var(--vf-success-700)]">Ø Einnahmen</div>
            <div className="text-lg font-bold text-[var(--vf-success-600)]">€17.450</div>
          </div>
          <div className="text-center p-3 bg-[var(--vf-error-50)] rounded-lg">
            <div className="text-xs text-[var(--vf-error-700)]">Ø Ausgaben</div>
            <div className="text-lg font-bold text-[var(--vf-error-600)]">€9.320</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}