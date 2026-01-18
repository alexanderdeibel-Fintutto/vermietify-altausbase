import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VfBadge } from '@/components/shared/VfBadge';
import { Button } from '@/components/ui/button';
import { Bell, AlertTriangle } from 'lucide-react';
import TimeAgo from '@/components/shared/TimeAgo';

export default function AlertManager() {
  const alerts = [
    { id: 1, type: 'error', title: 'Zahlungsverzug', message: 'Miete für Einheit 3B überfällig', created: new Date() },
    { id: 2, type: 'warning', title: 'Vertrag läuft aus', message: 'Vertrag endet in 45 Tagen', created: new Date() }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Alerts
          {alerts.length > 0 && (
            <VfBadge variant="error">{alerts.length}</VfBadge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div key={alert.id} className="p-4 border-l-4 border-[var(--vf-error-500)] bg-[var(--vf-error-50)] rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-[var(--vf-error-600)] flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-medium mb-1">{alert.title}</div>
                  <p className="text-sm text-[var(--theme-text-secondary)] mb-2">{alert.message}</p>
                  <TimeAgo date={alert.created} className="text-xs" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}