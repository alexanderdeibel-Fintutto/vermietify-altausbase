import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Download, FileArchive } from 'lucide-react';
import { toast } from 'sonner';

export default function DocumentExportPanel() {
  const [exportType, setExportType] = useState('category');
  const [exportValue, setExportValue] = useState('Finanzen');

  const { data: documents = [] } = useQuery({
    queryKey: ['documents'],
    queryFn: () => base44.entities.Document.list('-created_date', 500)
  });

  const exportMutation = useMutation({
    mutationFn: async ({ type, value }) => {
      const response = await base44.functions.invoke('exportDocumentsZIP', {
        filter_type: type,
        filter_value: value
      });
      return response.data;
    },
    onSuccess: (data) => {
      window.open(data.download_url, '_blank');
      toast.success('Export gestartet');
    }
  });

  const categories = ['Mietrecht', 'Verwaltung', 'Finanzen', 'Sonstiges'];
  const years = [...new Set(documents.map(d => new Date(d.created_date).getFullYear()))];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileArchive className="w-5 h-5" />
          Dokumente exportieren
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select value={exportType} onValueChange={setExportType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="category">Nach Kategorie</SelectItem>
            <SelectItem value="year">Nach Jahr</SelectItem>
            <SelectItem value="all">Alle Dokumente</SelectItem>
          </SelectContent>
        </Select>

        {exportType === 'category' && (
          <Select value={exportValue} onValueChange={setExportValue}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {exportType === 'year' && (
          <Select value={exportValue} onValueChange={setExportValue}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Button
          onClick={() => exportMutation.mutate({ type: exportType, value: exportValue })}
          disabled={exportMutation.isPending}
          className="w-full bg-indigo-600"
        >
          <Download className="w-4 h-4 mr-2" />
          {exportMutation.isPending ? 'Erstelle ZIP...' : 'Als ZIP herunterladen'}
        </Button>
      </CardContent>
    </Card>
  );
}