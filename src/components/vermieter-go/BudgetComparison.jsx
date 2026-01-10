import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, AlertTriangle } from 'lucide-react';

export default function BudgetComparison({ buildingId }) {
  const categories = [
    { name: 'Wartung', budget: 5000, actual: 3200 },
    { name: 'Reparaturen', budget: 3000, actual: 4100 },
    { name: 'Reinigung', budget: 2000, actual: 1800 },
    { name: 'Verwaltung', budget: 1500, actual: 1500 }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Budget vs. Ist</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {categories.map(cat => {
          const percentage = (cat.actual / cat.budget) * 100;
          const isOver = percentage > 100;
          
          return (
            <div key={cat.name}>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-semibold">{cat.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600">
                    {cat.actual.toLocaleString('de-DE')}€ / {cat.budget.toLocaleString('de-DE')}€
                  </span>
                  {isOver && <AlertTriangle className="w-3 h-3 text-red-600" />}
                </div>
              </div>
              <Progress value={Math.min(percentage, 100)} className={isOver ? 'bg-red-200' : ''} />
              <p className="text-xs text-right mt-1 text-slate-600">{percentage.toFixed(0)}%</p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}