import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { RefreshCw, CheckCircle, Landmark } from 'lucide-react';
import { toast } from 'sonner';

export default function FinAPISyncPanel() {
  const { data: syncJobs = [] } = useQuery({
    queryKey: ['syncJobs'],
    queryFn: () => base44.entities.SyncJob.list('-created_date', 10)
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('syncFinancialDataFromBanks', {
        sync_all_accounts: true
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`${data.transactions_synced} Transaktionen synchronisiert`);
    }
  });

  const lastSync = syncJobs[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Landmark className="w-5 h-5" />
          Bank-Synchronisation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {lastSync && (
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <p className="text-sm font-semibold text-green-900">Letzte Sync</p>
            </div>
            <p className="text-xs text-slate-600">
              {new Date(lastSync.created_date).toLocaleString('de-DE')}
            </p>
          </div>
        )}

        <Button
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          className="w-full bg-blue-600"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
          {syncMutation.isPending ? 'Synchronisiere...' : 'Jetzt synchronisieren'}
        </Button>

        <div className="space-y-2">
          <p className="text-sm font-semibold">Letzte Sync-Jobs:</p>
          {syncJobs.slice(0, 3).map(job => (
            <div key={job.id} className="flex justify-between p-2 bg-slate-50 rounded text-sm">
              <span>{job.sync_type}</span>
              <Badge className={job.status === 'completed' ? 'bg-green-600' : 'bg-orange-600'}>
                {job.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}