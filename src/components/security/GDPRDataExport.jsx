import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Download, Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function GDPRDataExport() {
  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('exportUserData', {});
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'my-data.json';
      a.click();
    },
    onSuccess: () => {
      toast.success('Daten exportiert');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          DSGVO-Datenexport
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-slate-600">
          Exportieren Sie alle Ihre gespeicherten persönlichen Daten gemäß DSGVO Art. 15
        </p>
        <Button onClick={() => exportMutation.mutate()} className="w-full">
          <Download className="w-4 h-4 mr-2" />
          Meine Daten exportieren
        </Button>
      </CardContent>
    </Card>
  );
}