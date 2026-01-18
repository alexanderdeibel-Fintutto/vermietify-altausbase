import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VfDatePicker } from '@/components/shared/VfDatePicker';
import { VfSelect } from '@/components/shared/VfSelect';
import { Button } from '@/components/ui/button';
import { Calendar, Save } from 'lucide-react';

export default function InspectionScheduler() {
  const [inspection, setInspection] = useState({
    building_id: '',
    inspection_date: '',
    inspector: ''
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Inspektion planen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <VfSelect
            label="Objekt"
            value={inspection.building_id}
            onChange={(v) => setInspection({ ...inspection, building_id: v })}
            options={[
              { value: '1', label: 'Hauptstraße 12' },
              { value: '2', label: 'Parkweg 8' }
            ]}
          />

          <VfDatePicker
            label="Datum"
            value={inspection.inspection_date}
            onChange={(v) => setInspection({ ...inspection, inspection_date: v })}
          />

          <VfSelect
            label="Prüfer"
            value={inspection.inspector}
            onChange={(v) => setInspection({ ...inspection, inspector: v })}
            options={[
              { value: 'internal', label: 'Intern' },
              { value: 'external', label: 'Extern' }
            ]}
          />

          <Button variant="gradient" className="w-full">
            <Save className="h-4 w-4 mr-2" />
            Inspektion anlegen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}