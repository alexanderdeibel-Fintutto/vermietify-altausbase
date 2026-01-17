import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VfInput } from '@/components/shared/VfInput';
import { Calculator } from 'lucide-react';
import CurrencyDisplay from '@/components/shared/CurrencyDisplay';
import PercentageDisplay from '@/components/shared/PercentageDisplay';

export default function RentIncreaseCalculator() {
  const [values, setValues] = useState({
    currentRent: 850,
    indexIncrease: 3.2
  });

  const newRent = values.currentRent * (1 + values.indexIncrease / 100);
  const increase = newRent - values.currentRent;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Mieterhöhung berechnen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <VfInput
            label="Aktuelle Miete (€)"
            type="number"
            value={values.currentRent}
            onChange={(e) => setValues({ ...values, currentRent: Number(e.target.value) })}
          />

          <VfInput
            label="Indexerhöhung (%)"
            type="number"
            step="0.1"
            value={values.indexIncrease}
            onChange={(e) => setValues({ ...values, indexIncrease: Number(e.target.value) })}
          />

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="text-center p-3 bg-[var(--theme-surface)] rounded-lg">
              <div className="text-xs text-[var(--theme-text-muted)]">Neue Miete</div>
              <CurrencyDisplay amount={newRent} className="text-xl font-bold" />
            </div>
            <div className="text-center p-3 bg-[var(--vf-success-50)] rounded-lg">
              <div className="text-xs text-[var(--vf-success-700)]">Erhöhung</div>
              <CurrencyDisplay amount={increase} className="text-xl font-bold text-[var(--vf-success-600)]" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}