import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

export default function MultiFormatExporter() {
  const [entityType, setEntityType] = useState('Building');
  const [format, setFormat] = useState('csv');

  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('exportData', { 
        entity_type: entityType,
        format 
      });
      const blob = new Blob([response.data.content], { type: response.data.mime_type });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export.${format}`;
      a.click();
    },
    onSuccess: () => {
      toast.success('Export erfolgreich');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          Multi-Format-Export
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select value={entityType} onValueChange={setEntityType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Building">Gebäude</SelectItem>
            <SelectItem value="Tenant">Mieter</SelectItem>
            <SelectItem value="FinancialItem">Finanzen</SelectItem>
          </SelectContent>
        </Select>
        <Select value={format} onValueChange={setFormat}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="csv">CSV</SelectItem>
            <SelectItem value="xlsx">Excel</SelectItem>
            <SelectItem value="json">JSON</SelectItem>
            <SelectItem value="pdf">PDF</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => exportMutation.mutate()} className="w-full">
          <Download className="w-4 h-4 mr-2" />
          Exportieren
        </Button>
      </CardContent>
    </Card>
  );
}