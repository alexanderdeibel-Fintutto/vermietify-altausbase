import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Landmark, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function FinAPIBankingSync() {
  const queryClient = useQueryClient();

  const { data: status } = useQuery({
    queryKey: ['finAPIStatus'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getFinAPIStatus', {});
      return response.data;
    }
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      await base44.functions.invoke('toggleAutoSync', { enabled: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finAPIStatus'] });
      toast.success('Sync aktiviert');
    }
  });

  if (!status) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Landmark className="w-5 h-5" />
          FinAPI Banking-Sync
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm">Auto-Sync</span>
          <Badge className={status.auto_sync ? 'bg-green-600' : 'bg-slate-600'}>
            {status.auto_sync ? 'Aktiv' : 'Inaktiv'}
          </Badge>
        </div>
        <div className="p-2 bg-slate-50 rounded">
          <p className="text-xs text-slate-600">Letzte Synchronisation:</p>
          <p className="text-sm font-semibold">{status.last_sync || 'Nie'}</p>
        </div>
        <Button onClick={() => syncMutation.mutate()} className="w-full">
          <RefreshCw className="w-4 h-4 mr-2" />
          Jetzt synchronisieren
        </Button>
      </CardContent>
    </Card>
  );
}