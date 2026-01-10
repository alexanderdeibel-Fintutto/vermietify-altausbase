import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Download, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function GDPRDataExport() {
  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('exportGDPRData', {});
      return response.data;
    },
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data.export, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'meine_daten_export.json';
      a.click();
      toast.success('Datenexport erstellt');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="w-5 h-5" />
          DSGVO Datenexport
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-slate-600">
          Alle Ihre gespeicherten Daten DSGVO-konform exportieren
        </p>
        <Button
          onClick={() => exportMutation.mutate()}
          disabled={exportMutation.isPending}
          className="w-full"
        >
          <Download className="w-4 h-4 mr-2" />
          {exportMutation.isPending ? 'Exportiere...' : 'Meine Daten herunterladen'}
        </Button>
      </CardContent>
    </Card>
  );
}