import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Wrench } from 'lucide-react';
import TimeAgo from '@/components/shared/TimeAgo';
import CurrencyDisplay from '@/components/shared/CurrencyDisplay';

export default function MaintenanceHistory({ buildingId }) {
  const history = [
    { id: 1, title: 'Heizungsreparatur', cost: 850, completed_date: new Date(Date.now() - 7 * 86400000) },
    { id: 2, title: 'Dachrinnenreinigung', cost: 320, completed_date: new Date(Date.now() - 30 * 86400000) }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Wartungshistorie
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {history.map((item) => (
            <div key={item.id} className="flex justify-between items-center p-3 bg-[var(--theme-surface)] rounded-lg">
              <div>
                <div className="font-medium text-sm">{item.title}</div>
                <TimeAgo date={item.completed_date} className="text-xs text-[var(--theme-text-muted)]" />
              </div>
              <CurrencyDisplay amount={item.cost} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}