import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VfSelect } from '@/components/shared/VfSelect';
import { VfCheckbox } from '@/components/shared/VfCheckbox';
import { Button } from '@/components/ui/button';
import { Clock, Plus } from 'lucide-react';

export default function ReportScheduler() {
  const [schedules, setSchedules] = useState([
    { id: 1, report: 'Monatsbericht Finanzen', frequency: 'monthly', active: true }
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Geplante Berichte
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 mb-4">
          {schedules.map((schedule) => (
            <div key={schedule.id} className="flex items-center justify-between p-3 bg-[var(--theme-surface)] rounded-lg">
              <div className="flex-1">
                <div className="font-medium text-sm">{schedule.report}</div>
                <div className="text-xs text-[var(--theme-text-muted)] mt-1">
                  {schedule.frequency === 'monthly' ? 'Monatlich' : schedule.frequency === 'weekly' ? 'Wöchentlich' : 'Täglich'}
                </div>
              </div>
              <VfCheckbox checked={schedule.active} />
            </div>
          ))}
        </div>

        <Button variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Neuer Zeitplan
        </Button>
      </CardContent>
    </Card>
  );
}