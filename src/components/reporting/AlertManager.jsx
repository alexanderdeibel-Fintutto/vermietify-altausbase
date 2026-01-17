import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell, AlertTriangle, Info } from 'lucide-react';
import { VfBadge } from '@/components/shared/VfBadge';

export default function AlertManager() {
  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      // Simulate alerts - in production, fetch from AlertRule entity
      return [
        { id: 1, type: 'warning', title: 'Zahlungsausfall', message: '2 offene Zahlungen überfällig', priority: 'high' },
        { id: 2, type: 'info', title: 'Vertragsende', message: '3 Verträge laufen in 60 Tagen aus', priority: 'medium' }
      ];
    }
  });

  const getIcon = (type) => {
    if (type === 'warning') return AlertTriangle;
    return Info;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Warnungen & Hinweise
          {alerts.length > 0 && (
            <VfBadge variant="error">{alerts.length}</VfBadge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert) => {
            const Icon = getIcon(alert.type);
            return (
              <div key={alert.id} className="flex items-start gap-3 p-3 bg-[var(--theme-surface)] rounded-lg">
                <Icon className="h-5 w-5 text-[var(--vf-warning-500)] flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{alert.title}</div>
                  <div className="text-xs text-[var(--theme-text-secondary)] mt-1">{alert.message}</div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}