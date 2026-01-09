import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { RefreshCw, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function BankSyncPanel({ userId }) {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);

  const { data: syncStatus } = useQuery({
    queryKey: ['bankSyncStatus', userId],
    queryFn: async () => {
      try {
        return await base44.functions.invoke('getFinAPIStatus', { userId });
      } catch (e) {
        return null;
      }
    },
    refetchInterval: 10000
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('finapiConnect', { userId });
      return response.data;
    },
    onSuccess: (data) => {
      if (data?.auth_url) {
        window.location.href = data.auth_url;
      }
    }
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      return await base44.functions.invoke('finapiSyncAssetPrices', { userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assetPortfolio'] });
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5" />
          Bank-Synchronisierung (FinAPI)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {syncStatus?.connected ? (
          <>
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <AlertTitle>Verbunden</AlertTitle>
              <AlertDescription>
                {syncStatus.accounts?.length || 0} Konten synchronisiert
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Synchronisierte Konten:</h4>
              {syncStatus.accounts?.map((acc) => (
                <div key={acc.id} className="p-3 bg-slate-50 rounded text-sm">
                  <div className="font-medium">{acc.bank_name}</div>
                  <div className="text-slate-600">
                    Saldo: €{acc.balance?.toFixed(2) || '0.00'}
                  </div>
                </div>
              ))}
            </div>

            <Button 
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              className="w-full gap-2"
            >
              {syncMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Wird synchronisiert...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Jetzt synchronisieren
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertTitle>Nicht verbunden</AlertTitle>
              <AlertDescription>
                Verbinden Sie Ihre Bankkonten für automatische Kursupdates und Transaktionsdaten.
              </AlertDescription>
            </Alert>

            <Button 
              onClick={() => connectMutation.mutate()}
              disabled={connectMutation.isPending}
              className="w-full"
            >
              {connectMutation.isPending ? 'Wird verbunden...' : 'Mit FinAPI verbinden'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}