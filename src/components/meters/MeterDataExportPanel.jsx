import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function MeterDataExportPanel({ buildingId }) {
  const [exporting, setExporting] = useState(false);
  const [exportConfig, setExportConfig] = useState({
    period_start: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0],
    period_end: new Date().toISOString().split('T')[0],
    export_format: 'csv',
    group_by: 'meter'
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list('-name', 100)
  });

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await base44.functions.invoke('exportMeterDataForOperatingCosts', {
        building_id: buildingId,
        ...exportConfig
      });

      if (exportConfig.export_format === 'csv' || exportConfig.export_format === 'pdf') {
        // Download file
        const blob = new Blob([response.data], { 
          type: exportConfig.export_format === 'csv' ? 'text/csv' : 'application/pdf' 
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `verbrauchsdaten_${new Date().toISOString().split('T')[0]}.${exportConfig.export_format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        
        toast.success('Export erfolgreich');
      }
    } catch (error) {
      toast.error('Export fehlgeschlagen');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          Export für Nebenkostenabrechnung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Zeitraum von</Label>
            <input
              type="date"
              value={exportConfig.period_start}
              onChange={(e) => setExportConfig({ ...exportConfig, period_start: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 mt-1"
            />
          </div>
          <div>
            <Label>Zeitraum bis</Label>
            <input
              type="date"
              value={exportConfig.period_end}
              onChange={(e) => setExportConfig({ ...exportConfig, period_end: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 mt-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Gruppierung</Label>
            <Select 
              value={exportConfig.group_by}
              onValueChange={(v) => setExportConfig({ ...exportConfig, group_by: v })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="meter">Nach Zähler</SelectItem>
                <SelectItem value="unit">Nach Wohneinheit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Format</Label>
            <Select 
              value={exportConfig.export_format}
              onValueChange={(v) => setExportConfig({ ...exportConfig, export_format: v })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV (Excel)</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleExport}
            disabled={exporting}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {exporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exportiere...
              </>
            ) : (
              <>
                {exportConfig.export_format === 'csv' ? (
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                ) : (
                  <FileText className="w-4 h-4 mr-2" />
                )}
                Jetzt exportieren
              </>
            )}
          </Button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
          <p className="font-semibold text-blue-900 mb-1">Export-Vorschau:</p>
          <p className="text-blue-800">
            • Format: {exportConfig.export_format.toUpperCase()}
          </p>
          <p className="text-blue-800">
            • Gruppierung: {exportConfig.group_by === 'meter' ? 'Pro Zähler' : 'Pro Wohneinheit'}
          </p>
          <p className="text-blue-800">
            • Zeitraum: {new Date(exportConfig.period_start).toLocaleDateString('de-DE')} - {new Date(exportConfig.period_end).toLocaleDateString('de-DE')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}