import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Coins, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function CryptoExchangeSync() {
  const queryClient = useQueryClient();

  const { data: holdings = [] } = useQuery({
    queryKey: ['cryptoHoldings'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getCryptoHoldings', {});
      return response.data.holdings;
    }
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      await base44.functions.invoke('syncCryptoExchange', {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cryptoHoldings'] });
      toast.success('Crypto-Daten synchronisiert');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="w-5 h-5" />
          Crypto-Exchange-Sync
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button onClick={() => syncMutation.mutate()} className="w-full">
          <RefreshCw className="w-4 h-4 mr-2" />
          Synchronisieren
        </Button>
        <div className="space-y-2">
          {holdings.map(holding => (
            <div key={holding.id} className="flex justify-between p-2 bg-slate-50 rounded">
              <div>
                <p className="text-sm font-semibold">{holding.symbol}</p>
                <p className="text-xs text-slate-600">{holding.amount} Coins</p>
              </div>
              <Badge className="bg-blue-600">{holding.value}€</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}