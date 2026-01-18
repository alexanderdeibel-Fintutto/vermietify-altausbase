import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { History, TrendingUp } from 'lucide-react';
import CurrencyDisplay from '@/components/shared/CurrencyDisplay';

export default function RentChangeHistory({ contractId }) {
  const changes = [
    { id: 1, date: '2024-01-01', old_rent: 800, new_rent: 850, reason: 'Indexmieterhöhung' },
    { id: 2, date: '2023-01-01', old_rent: 750, new_rent: 800, reason: 'Jährliche Anpassung' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Miethistorie
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {changes.map((change) => (
            <div key={change.id} className="p-3 bg-[var(--theme-surface)] rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div className="text-sm font-medium">{change.reason}</div>
                <div className="text-xs text-[var(--theme-text-muted)]">
                  {new Date(change.date).toLocaleDateString('de-DE')}
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CurrencyDisplay amount={change.old_rent} />
                <TrendingUp className="h-4 w-4 text-[var(--vf-success-500)]" />
                <CurrencyDisplay amount={change.new_rent} className="font-bold" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}