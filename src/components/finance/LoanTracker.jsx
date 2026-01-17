import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VfProgress } from '@/components/shared/VfProgress';
import { Landmark } from 'lucide-react';
import CurrencyDisplay from '@/components/shared/CurrencyDisplay';

export default function LoanTracker({ 
  originalAmount = 250000,
  remainingAmount = 185000,
  monthlyPayment = 1250 
}) {
  const paidPercentage = ((originalAmount - remainingAmount) / originalAmount) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Landmark className="h-5 w-5" />
          Darlehen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-[var(--theme-text-muted)]">Restschuld</span>
            <CurrencyDisplay amount={remainingAmount} className="text-2xl font-bold" />
          </div>

          <VfProgress 
            value={paidPercentage} 
            max={100} 
            variant="gradient"
            showValue
          />

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <div className="text-xs text-[var(--theme-text-muted)]">Ursprünglich</div>
              <CurrencyDisplay amount={originalAmount} className="font-semibold" />
            </div>
            <div>
              <div className="text-xs text-[var(--theme-text-muted)]">Monatlich</div>
              <CurrencyDisplay amount={monthlyPayment} className="font-semibold" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}