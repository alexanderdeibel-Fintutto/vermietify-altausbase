import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VfSwitch } from '@/components/shared/VfSwitch';
import { Bell } from 'lucide-react';

export default function AlertManager() {
  const alerts = [
    { id: 1, name: 'Budget-Überschreitung', enabled: true, threshold: '80%' },
    { id: 2, name: 'Zahlungsverzug', enabled: true, threshold: '3 Tage' },
    { id: 3, name: 'Vertragsende', enabled: false, threshold: '60 Tage' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Automatische Warnungen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div key={alert.id} className="flex items-center justify-between p-3 bg-[var(--theme-surface)] rounded-lg">
              <div className="flex-1">
                <div className="font-medium text-sm">{alert.name}</div>
                <div className="text-xs text-[var(--theme-text-muted)] mt-1">
                  Schwellenwert: {alert.threshold}
                </div>
              </div>
              <VfSwitch checked={alert.enabled} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}