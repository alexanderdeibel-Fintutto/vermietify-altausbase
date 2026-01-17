import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Brain, TrendingUp } from 'lucide-react';
import CurrencyDisplay from '@/components/shared/CurrencyDisplay';

export default function PredictiveAnalytics() {
  const predictions = [
    { title: 'Erwartete Einnahmen Q2', value: 48500, trend: 5.2 },
    { title: 'Leerstandsquote', value: 3.5, trend: -1.2, isPercentage: true },
    { title: 'Instandhaltungskosten', value: 12000, trend: 8.5 }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          KI-Prognosen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {predictions.map((pred, index) => (
            <div key={index} className="p-4 bg-[var(--theme-surface)] rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-[var(--theme-text-muted)]">{pred.title}</div>
                <div className={`flex items-center gap-1 text-xs font-semibold ${
                  pred.trend > 0 ? 'text-[var(--vf-success-600)]' : 'text-[var(--vf-error-600)]'
                }`}>
                  <TrendingUp className="h-3 w-3" />
                  {pred.trend > 0 ? '+' : ''}{pred.trend}%
                </div>
              </div>
              <div className="text-2xl font-bold">
                {pred.isPercentage ? `${pred.value}%` : <CurrencyDisplay amount={pred.value} />}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}