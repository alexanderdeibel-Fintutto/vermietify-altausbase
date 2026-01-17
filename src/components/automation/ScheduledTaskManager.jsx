import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VfSwitch } from '@/components/shared/VfSwitch';
import { Clock } from 'lucide-react';

export default function ScheduledTaskManager() {
  const tasks = [
    { id: 1, name: 'Zahlungserinnerungen versenden', enabled: true, schedule: 'Täglich um 09:00' },
    { id: 2, name: 'Vertragsende-Hinweise', enabled: true, schedule: 'Monatlich am 1.' },
    { id: 3, name: 'Backup erstellen', enabled: true, schedule: 'Täglich um 03:00' },
    { id: 4, name: 'Berichte generieren', enabled: false, schedule: 'Wöchentlich Montags' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Geplante Aufgaben
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between p-3 bg-[var(--theme-surface)] rounded-lg">
              <div className="flex-1">
                <div className="font-medium text-sm">{task.name}</div>
                <div className="text-xs text-[var(--theme-text-muted)] mt-1">{task.schedule}</div>
              </div>
              <VfSwitch checked={task.enabled} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}