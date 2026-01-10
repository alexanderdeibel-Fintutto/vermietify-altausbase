import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

export default function MultiFormatExporter() {
  const [format, setFormat] = useState('csv');
  const [dataType, setDataType] = useState('all');

  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('exportData', { format, data_type: dataType });
      return response.data;
    },
    onSuccess: (data) => {
      const blob = new Blob([data.content], { type: data.mime_type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      a.click();
      toast.success('Export erstellt');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Multi-Format Export</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select value={format} onValueChange={setFormat}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="csv">CSV</SelectItem>
            <SelectItem value="excel">Excel</SelectItem>
            <SelectItem value="pdf">PDF</SelectItem>
            <SelectItem value="json">JSON</SelectItem>
          </SelectContent>
        </Select>
        <Select value={dataType} onValueChange={setDataType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Daten</SelectItem>
            <SelectItem value="financial">Nur Finanzen</SelectItem>
            <SelectItem value="tax">Nur Steuer</SelectItem>
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