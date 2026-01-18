import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import CurrencyDisplay from '@/components/shared/CurrencyDisplay';

export default function MarketPriceValuation({ buildingId }) {
  const valuation = {
    current: 850000,
    market: 920000,
    sqmPrice: 3800,
    potential: 70000,
    trend: 'up'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Marktwertanalyse
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center p-4 bg-[var(--theme-surface)] rounded-lg">
            <div className="text-sm text-[var(--theme-text-muted)] mb-1">Geschätzter Marktwert</div>
            <CurrencyDisplay amount={valuation.market} className="text-2xl font-bold" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-[var(--theme-surface)] rounded-lg">
              <div className="text-xs text-[var(--theme-text-muted)] mb-1">Aktueller Wert</div>
              <CurrencyDisplay amount={valuation.current} />
            </div>
            <div className="p-3 bg-[var(--theme-surface)] rounded-lg">
              <div className="text-xs text-[var(--theme-text-muted)] mb-1">Preis/m²</div>
              <CurrencyDisplay amount={valuation.sqmPrice} />
            </div>
          </div>

          <div className="p-3 bg-[var(--vf-success-50)] border border-[var(--vf-success-200)] rounded-lg">
            <div className="text-sm font-medium text-[var(--vf-success-700)]">
              Wertsteigerungspotential
            </div>
            <CurrencyDisplay amount={valuation.potential} className="text-lg font-bold text-[var(--vf-success-700)]" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}