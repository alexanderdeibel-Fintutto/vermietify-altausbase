import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Euro, TrendingUp } from 'lucide-react';
import CurrencyDisplay from '@/components/shared/CurrencyDisplay';

export default function RevenueWidget({ currentMonth = 15800, lastMonth = 14950 }) {
  const change = ((currentMonth - lastMonth) / lastMonth) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Euro className="h-5 w-5" />
          Mieteinnahmen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CurrencyDisplay 
          amount={currentMonth}
          className="text-3xl font-bold mb-2"
        />
        <div className="flex items-center gap-2 text-sm">
          <TrendingUp className="h-4 w-4 text-[var(--vf-success-600)]" />
          <span className="text-[var(--vf-success-600)] font-semibold">
            +{change.toFixed(1)}%
          </span>
          <span className="text-[var(--theme-text-muted)]">
            vs. letzter Monat
          </span>
        </div>
      </CardContent>
    </Card>
  );
}