import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VfProgress } from '@/components/shared/VfProgress';
import { Wallet } from 'lucide-react';
import CurrencyDisplay from '@/components/shared/CurrencyDisplay';

export default function BudgetTracker({ budget = 10000, spent = 6500, category = 'Instandhaltung' }) {
  const percentage = (spent / budget) * 100;
  const remaining = budget - spent;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Budget: {category}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-[var(--theme-text-muted)]">Ausgegeben</span>
            <CurrencyDisplay amount={spent} className="text-xl font-bold" />
          </div>

          <VfProgress 
            value={percentage} 
            max={100} 
            variant={percentage > 90 ? 'error' : percentage > 75 ? 'warning' : 'success'}
            showValue
          />

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <div className="text-xs text-[var(--theme-text-muted)]">Budget</div>
              <CurrencyDisplay amount={budget} className="font-semibold" />
            </div>
            <div>
              <div className="text-xs text-[var(--theme-text-muted)]">Verbleibend</div>
              <CurrencyDisplay 
                amount={remaining} 
                className={`font-semibold ${remaining < 0 ? 'text-[var(--vf-error-600)]' : ''}`}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}