import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ExportManager({ selectedSubmissions = [] }) {
  const [format, setFormat] = useState('json');
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (selectedSubmissions.length === 0) {
      toast.error('Keine Submissions ausgewählt');
      return;
    }

    setExporting(true);
    try {
      const response = await base44.functions.invoke('exportMultipleFormats', {
        submission_ids: selectedSubmissions,
        format
      });

      const blob = new Blob([response.data], { 
        type: format === 'json' ? 'application/json' : format === 'csv' ? 'text/csv' : 'application/xml'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `elster_export.${format}`;
      a.click();

      toast.success('Export erfolgreich');
    } catch (error) {
      toast.error('Export fehlgeschlagen');
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Export-Manager
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Select value={format} onValueChange={setFormat}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="json">JSON</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="xml">XML</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm text-slate-600">
          {selectedSubmissions.length} Submissions ausgewählt
        </div>

        <Button
          onClick={handleExport}
          disabled={exporting || selectedSubmissions.length === 0}
          className="w-full"
        >
          <Download className="w-4 h-4 mr-2" />
          {exporting ? 'Exportiere...' : 'Exportieren'}
        </Button>
      </CardContent>
    </Card>
  );
}