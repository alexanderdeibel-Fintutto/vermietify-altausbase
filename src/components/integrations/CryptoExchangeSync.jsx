import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bitcoin, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function CryptoExchangeSync() {
  const [apiKey, setApiKey] = useState('');
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
      await base44.functions.invoke('syncCryptoExchange', { api_key: apiKey });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cryptoHoldings'] });
      toast.success('Crypto-Portfolio synchronisiert');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bitcoin className="w-5 h-5" />
          Crypto Exchange
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          placeholder="API Key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          type="password"
        />
        <Button onClick={() => syncMutation.mutate()} disabled={!apiKey} className="w-full">
          <RefreshCw className="w-4 h-4 mr-2" />
          Verbinden
        </Button>
        {holdings.map(h => (
          <div key={h.symbol} className="flex items-center justify-between p-2 bg-slate-50 rounded">
            <span className="font-semibold text-sm">{h.symbol}</span>
            <div className="text-right">
              <p className="text-sm font-semibold">{h.amount}</p>
              <Badge className="text-xs">{h.value_eur}€</Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}