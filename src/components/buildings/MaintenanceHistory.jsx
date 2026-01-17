import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { History } from 'lucide-react';
import CurrencyDisplay from '@/components/shared/CurrencyDisplay';
import TimeAgo from '@/components/shared/TimeAgo';

export default function MaintenanceHistory({ buildingId }) {
  const history = [
    { id: 1, title: 'Heizungswartung', cost: 450, completed_date: '2026-01-10' },
    { id: 2, title: 'Dachreparatur', cost: 2800, completed_date: '2025-12-15' },
    { id: 3, title: 'Aufzug-Service', cost: 320, completed_date: '2025-11-20' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Wartungshistorie
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {history.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 bg-[var(--theme-surface)] rounded-lg">
              <div>
                <div className="font-medium text-sm">{item.title}</div>
                <TimeAgo date={item.completed_date} className="text-xs text-[var(--theme-text-muted)]" />
              </div>
              <CurrencyDisplay amount={item.cost} className="font-bold" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}