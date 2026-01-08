import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, Loader2, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

export default function FinancialDataSync() {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  const { data: syncStatus } = useQuery({
    queryKey: ['financial-sync-status'],
    queryFn: async () => {
      const logs = await base44.entities.ActivityLog.filter({
        action: 'financial_data_synced'
      });
      return logs.sort((a, b) => 
        new Date(b.created_date).getTime() - new Date(a.created_date).getTime()
      )[0];
    }
  });

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await base44.functions.invoke('syncFinancialDataToElster', {});
      
      if (response.data.success) {
        setLastSync(response.data.sync_result);
        toast.success(`${response.data.sync_result.synced_items} Positionen synchronisiert`);
      }
    } catch (error) {
      toast.error('Synchronisation fehlgeschlagen');
      console.error(error);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Finanzdaten-Synchronisation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            Synchronisiert automatisch Einnahmen, Ausgaben und Bankdaten mit ELSTER-Formularen.
          </AlertDescription>
        </Alert>

        {syncStatus && (
          <div className="p-3 bg-slate-50 rounded">
            <div className="text-sm text-slate-600 mb-1">Letzte Synchronisation</div>
            <div className="text-xs text-slate-500">
              {new Date(syncStatus.created_date).toLocaleString('de-DE')}
            </div>
            {syncStatus.metadata?.items_synced && (
              <div className="text-sm font-medium mt-2">
                {syncStatus.metadata.items_synced} Positionen
              </div>
            )}
          </div>
        )}

        {lastSync && (
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-green-50 rounded">
              <div className="text-xs text-green-600">Synchronisiert</div>
              <div className="text-2xl font-bold text-green-700">{lastSync.synced_items}</div>
            </div>
            <div className="p-3 bg-yellow-50 rounded">
              <div className="text-xs text-yellow-600">Übersprungen</div>
              <div className="text-2xl font-bold text-yellow-700">{lastSync.skipped_items}</div>
            </div>
          </div>
        )}

        <Button 
          onClick={handleSync}
          disabled={syncing}
          className="w-full"
        >
          {syncing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Jetzt synchronisieren
        </Button>
      </CardContent>
    </Card>
  );
}