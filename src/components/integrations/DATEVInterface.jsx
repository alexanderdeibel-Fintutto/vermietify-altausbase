import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileSpreadsheet, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function DATEVInterface() {
  const { data: status } = useQuery({
    queryKey: ['datevStatus'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getDATEVStatus', {});
      return response.data;
    }
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      await base44.functions.invoke('exportToDATEV', {});
    },
    onSuccess: () => {
      toast.success('DATEV-Export erfolgreich');
    }
  });

  if (!status) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5" />
          DATEV-Schnittstelle
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="p-2 bg-slate-50 rounded">
          <p className="text-xs text-slate-600">Letzter Export:</p>
          <p className="text-sm font-semibold">{status.last_export || 'Nie'}</p>
        </div>
        <Button onClick={() => exportMutation.mutate()} className="w-full">
          <Download className="w-4 h-4 mr-2" />
          Nach DATEV exportieren
        </Button>
      </CardContent>
    </Card>
  );
}