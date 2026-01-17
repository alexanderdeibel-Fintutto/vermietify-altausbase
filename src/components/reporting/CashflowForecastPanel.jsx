import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import SimpleLineChart from '@/components/charts/SimpleLineChart';
import { TrendingUp } from 'lucide-react';

export default function CashflowForecastPanel() {
  const data = [
    { name: 'Jan', value: 12500 },
    { name: 'Feb', value: 13200 },
    { name: 'Mär', value: 12800 },
    { name: 'Apr', value: 14100 },
    { name: 'Mai', value: 13900 },
    { name: 'Jun', value: 15200 }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Cashflow-Prognose
        </CardTitle>
      </CardHeader>
      <CardContent>
        <SimpleLineChart 
          data={data}
          height={250}
          color="#16A34A"
        />
        <div className="mt-4 grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-xs text-[var(--theme-text-muted)]">Durchschnitt</div>
            <div className="text-lg font-bold text-[var(--vf-primary-600)]">€13.450</div>
          </div>
          <div>
            <div className="text-xs text-[var(--theme-text-muted)]">Trend</div>
            <div className="text-lg font-bold text-[var(--vf-success-600)]">+8.2%</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}