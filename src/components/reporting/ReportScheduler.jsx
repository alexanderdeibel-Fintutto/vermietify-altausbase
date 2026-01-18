import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VfSelect } from '@/components/shared/VfSelect';
import { VfSwitch } from '@/components/shared/VfSwitch';
import { Button } from '@/components/ui/button';
import { Clock, Save } from 'lucide-react';

export default function ReportScheduler() {
  const [schedule, setSchedule] = useState({
    enabled: false,
    frequency: 'monthly',
    time: '09:00',
    recipients: ''
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Automatische Berichte
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <VfSwitch
            label="Automatische Berichte aktivieren"
            checked={schedule.enabled}
            onCheckedChange={(v) => setSchedule({ ...schedule, enabled: v })}
          />

          {schedule.enabled && (
            <>
              <VfSelect
                label="Häufigkeit"
                value={schedule.frequency}
                onChange={(v) => setSchedule({ ...schedule, frequency: v })}
                options={[
                  { value: 'weekly', label: 'Wöchentlich' },
                  { value: 'monthly', label: 'Monatlich' },
                  { value: 'quarterly', label: 'Vierteljährlich' }
                ]}
              />

              <VfSelect
                label="Uhrzeit"
                value={schedule.time}
                onChange={(v) => setSchedule({ ...schedule, time: v })}
                options={[
                  { value: '09:00', label: '09:00 Uhr' },
                  { value: '12:00', label: '12:00 Uhr' },
                  { value: '18:00', label: '18:00 Uhr' }
                ]}
              />
            </>
          )}

          <Button variant="gradient" className="w-full">
            <Save className="h-4 w-4 mr-2" />
            Speichern
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}