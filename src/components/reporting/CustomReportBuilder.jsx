import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VfSelect } from '@/components/shared/VfSelect';
import { VfDatePicker } from '@/components/shared/VfDatePicker';
import { VfCheckbox } from '@/components/shared/VfCheckbox';
import { Button } from '@/components/ui/button';
import { FileText, Play } from 'lucide-react';

export default function CustomReportBuilder() {
  const [config, setConfig] = useState({
    type: 'financial',
    dateFrom: '',
    dateTo: '',
    includeCharts: true,
    includeDetails: false
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Bericht erstellen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <VfSelect
            label="Berichtstyp"
            value={config.type}
            onChange={(v) => setConfig({ ...config, type: v })}
            options={[
              { value: 'financial', label: 'Finanzbericht' },
              { value: 'occupancy', label: 'Auslastungsbericht' },
              { value: 'maintenance', label: 'Wartungsbericht' }
            ]}
          />

          <VfDatePicker
            label="Von"
            value={config.dateFrom}
            onChange={(v) => setConfig({ ...config, dateFrom: v })}
          />

          <VfDatePicker
            label="Bis"
            value={config.dateTo}
            onChange={(v) => setConfig({ ...config, dateTo: v })}
          />

          <VfCheckbox
            label="Diagramme einschließen"
            checked={config.includeCharts}
            onCheckedChange={(v) => setConfig({ ...config, includeCharts: v })}
          />

          <VfCheckbox
            label="Detaillierte Aufschlüsselung"
            checked={config.includeDetails}
            onCheckedChange={(v) => setConfig({ ...config, includeDetails: v })}
          />

          <Button variant="gradient" className="w-full">
            <Play className="h-4 w-4 mr-2" />
            Bericht generieren
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}