import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { RefreshCw, TrendingUp, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export default function PriceUpdateStatus({ portfolio = [] }) {
  const { data: priceHistory = [] } = useQuery({
    queryKey: ['priceHistory'],
    queryFn: async () => {
      const results = await base44.entities.PriceHistory.list('-recorded_at', 100);
      return results || [];
    },
    refetchInterval: 5 * 60 * 1000 // 5 minutes
  });

  const syncPricesMutation = useMutation({
    mutationFn: async () => {
      return await base44.functions.invoke('dailyPriceUpdate', {});
    }
  });

  const getLatestPrice = (assetId) => {
    const history = priceHistory.filter(h => h.asset_portfolio_id === assetId);
    return history[0];
  };

  const formatRelativeTime = (date) => {
    if (!date) return 'nie';
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `vor ${diffMins}m`;
    if (diffHours < 24) return `vor ${diffHours}h`;
    return `vor ${diffDays}d`;
  };

  const statsCount = {
    updated: portfolio.filter(p => {
      const latest = getLatestPrice(p.id);
      return latest && new Date(latest.recorded_at) > new Date(Date.now() - 24 * 60 * 60 * 1000);
    }).length,
    stale: portfolio.filter(p => {
      const latest = getLatestPrice(p.id);
      return latest && new Date(latest.recorded_at) <= new Date(Date.now() - 24 * 60 * 60 * 1000);
    }).length,
    errors: portfolio.filter(p => !getLatestPrice(p.id)).length
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-light">Kurs-Updates</CardTitle>
        <Button
          onClick={() => syncPricesMutation.mutate()}
          disabled={syncPricesMutation.isPending}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${syncPricesMutation.isPending ? 'animate-spin' : ''}`} />
          Aktualisieren
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-xs text-green-600 font-light">Aktuell</div>
                <div className="text-lg font-light text-green-900">{statsCount.updated}</div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <div>
                <div className="text-xs text-yellow-600 font-light">Veraltet</div>
                <div className="text-lg font-light text-yellow-900">{statsCount.stale}</div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <div>
                <div className="text-xs text-red-600 font-light">Fehler</div>
                <div className="text-lg font-light text-red-900">{statsCount.errors}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Asset Update Status */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {portfolio.map(asset => {
            const latest = getLatestPrice(asset.id);
            const isRecent = latest && new Date(latest.recorded_at) > new Date(Date.now() - 24 * 60 * 60 * 1000);
            const priceChange = latest ? ((latest.price - asset.purchase_price) / asset.purchase_price * 100) : 0;

            return (
              <div key={asset.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-slate-900">{asset.name}</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    {latest ? formatRelativeTime(latest.recorded_at) : 'Nicht aktualisiert'}
                  </p>
                </div>
                <div className="text-right">
                  {latest && (
                    <div className="text-sm">
                      <div className="font-light text-slate-900">{latest.currency} {latest.price.toFixed(2)}</div>
                      <div className={`text-xs ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(1)}%
                      </div>
                    </div>
                  )}
                  <Badge variant={isRecent ? 'default' : 'secondary'} className="mt-2">
                    {latest ? (isRecent ? '✓ Aktuell' : 'Veraltet') : 'Fehler'}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}