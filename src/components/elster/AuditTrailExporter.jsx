import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AuditTrailExporter({ submissionId }) {
  const [format, setFormat] = useState('json');
  const [exporting, setExporting] = useState(false);

  const exportAudit = async () => {
    setExporting(true);
    try {
      const response = await base44.functions.invoke('exportAuditTrail', {
        submission_id: submissionId,
        format
      });

      const blob = new Blob([response.data], { 
        type: format === 'json' ? 'application/json' : 'text/csv'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_trail.${format}`;
      a.click();

      toast.success('Audit-Trail exportiert');
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
          Audit-Trail Export
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={format} onValueChange={setFormat}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="json">JSON</SelectItem>
            <SelectItem value="csv">CSV</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={exportAudit} disabled={exporting} className="w-full">
          <Download className="w-4 h-4 mr-2" />
          {exporting ? 'Exportiere...' : 'Audit-Trail exportieren'}
        </Button>
      </CardContent>
    </Card>
  );
}