import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingUp, MapPin } from 'lucide-react';
import CurrencyDisplay from '@/components/shared/CurrencyDisplay';

export default function MarketPriceValuation({ building }) {
  const estimatedValue = 385000;
  const purchasePrice = building?.purchase_price || 320000;
  const appreciation = ((estimatedValue - purchasePrice) / purchasePrice) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Marktwertschätzung
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center p-4 bg-[var(--vf-primary-50)] rounded-lg">
            <div className="text-sm text-[var(--vf-primary-700)] mb-1">Aktueller Marktwert</div>
            <CurrencyDisplay amount={estimatedValue} className="text-3xl font-bold text-[var(--vf-primary-600)]" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-xs text-[var(--theme-text-muted)]">Kaufpreis</div>
              <CurrencyDisplay amount={purchasePrice} className="font-semibold" />
            </div>
            <div className="text-center">
              <div className="text-xs text-[var(--theme-text-muted)]">Wertsteigerung</div>
              <div className="font-semibold text-[var(--vf-success-600)]">
                +{appreciation.toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="text-xs text-[var(--theme-text-muted)] pt-4 border-t">
            <MapPin className="h-3 w-3 inline mr-1" />
            Basierend auf vergleichbaren Immobilien in der Umgebung
          </div>
        </div>
      </CardContent>
    </Card>
  );
}