import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

export default function DATEVExporter() {
  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('exportDATEV', {});
      return response.data;
    },
    onSuccess: (data) => {
      const blob = new Blob([data.csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `datev_export_${new Date().toISOString()}.csv`;
      a.click();
      toast.success('DATEV-Export erstellt');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>DATEV Export</CardTitle>
      </CardHeader>
      <CardContent>
        <Button
          onClick={() => exportMutation.mutate()}
          disabled={exportMutation.isPending}
          className="w-full"
        >
          <Download className="w-4 h-4 mr-2" />
          {exportMutation.isPending ? 'Exportiere...' : 'DATEV CSV herunterladen'}
        </Button>
      </CardContent>
    </Card>
  );
}