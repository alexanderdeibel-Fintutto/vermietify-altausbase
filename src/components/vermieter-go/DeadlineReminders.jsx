import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell, AlertTriangle } from 'lucide-react';

export default function DeadlineReminders() {
  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => base44.entities.LeaseContract.filter({ status: 'active' }, null, 100)
  });

  const upcomingDeadlines = contracts
    .filter(c => c.end_date && !c.is_unlimited)
    .map(c => ({
      ...c,
      daysUntil: Math.floor((new Date(c.end_date) - new Date()) / (1000 * 60 * 60 * 24))
    }))
    .filter(c => c.daysUntil > 0 && c.daysUntil <= 90)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Fristen & Erinnerungen
          {upcomingDeadlines.length > 0 && <Badge className="bg-orange-600">{upcomingDeadlines.length}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {upcomingDeadlines.slice(0, 5).map(contract => (
          <div key={contract.id} className="p-2 bg-orange-50 rounded border border-orange-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-semibold">Vertrag läuft aus</p>
                <p className="text-xs text-slate-600">Einheit: {contract.unit_id}</p>
              </div>
              <Badge className={
                contract.daysUntil <= 30 ? 'bg-red-600' : 'bg-orange-600'
              }>
                {contract.daysUntil} Tage
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}