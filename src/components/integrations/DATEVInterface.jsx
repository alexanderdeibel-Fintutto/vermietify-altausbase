import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Database, Upload } from 'lucide-react';
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
      const response = await base44.functions.invoke('exportToDATEV', {});
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`${data.exported} Buchungen exportiert`);
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          DATEV-Schnittstelle
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Badge className="bg-blue-600">Konfiguriert</Badge>
        <div className="p-3 bg-slate-50 rounded-lg">
          <p className="text-sm">Letzte Synchronisation:</p>
          <p className="text-xs text-slate-600">{status?.last_sync || 'Noch nie'}</p>
        </div>
        <Button onClick={() => exportMutation.mutate()} className="w-full">
          <Upload className="w-4 h-4 mr-2" />
          Zu DATEV exportieren
        </Button>
      </CardContent>
    </Card>
  );
}