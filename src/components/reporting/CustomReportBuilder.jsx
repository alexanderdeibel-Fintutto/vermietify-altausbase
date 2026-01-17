import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VfSelect } from '@/components/shared/VfSelect';
import { VfCheckbox } from '@/components/shared/VfCheckbox';
import { Button } from '@/components/ui/button';
import { FileBarChart, Download } from 'lucide-react';
import DateRangeSelector from '@/components/shared/DateRangeSelector';

export default function CustomReportBuilder({ onGenerate }) {
  const [config, setConfig] = useState({
    reportType: 'financial',
    dateRange: { from: null, to: null },
    includeCharts: true,
    includeDetails: true,
    format: 'pdf'
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileBarChart className="h-5 w-5" />
          Bericht erstellen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <VfSelect
            label="Berichtstyp"
            value={config.reportType}
            onChange={(v) => setConfig({ ...config, reportType: v })}
            options={[
              { value: 'financial', label: 'Finanzbericht' },
              { value: 'occupancy', label: 'Belegungsbericht' },
              { value: 'maintenance', label: 'Wartungsbericht' },
              { value: 'tax', label: 'Steuerbericht' }
            ]}
          />

          <DateRangeSelector
            value={config.dateRange}
            onChange={(range) => setConfig({ ...config, dateRange: range })}
          />

          <div className="space-y-2">
            <VfCheckbox
              checked={config.includeCharts}
              onCheckedChange={(v) => setConfig({ ...config, includeCharts: v })}
              label="Diagramme einschließen"
            />
            <VfCheckbox
              checked={config.includeDetails}
              onCheckedChange={(v) => setConfig({ ...config, includeDetails: v })}
              label="Detailansicht"
            />
          </div>

          <VfSelect
            label="Format"
            value={config.format}
            onChange={(v) => setConfig({ ...config, format: v })}
            options={[
              { value: 'pdf', label: 'PDF' },
              { value: 'excel', label: 'Excel' },
              { value: 'csv', label: 'CSV' }
            ]}
          />

          <Button 
            variant="gradient"
            className="w-full"
            onClick={() => onGenerate(config)}
          >
            <Download className="h-4 w-4 mr-2" />
            Bericht generieren
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}