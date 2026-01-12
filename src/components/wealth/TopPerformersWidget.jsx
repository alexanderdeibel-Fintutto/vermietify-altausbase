import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function TopPerformersWidget() {
  const { data: holdings = [] } = useQuery({
    queryKey: ['all-holdings'],
    queryFn: () => base44.entities.AssetHolding.list()
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: () => base44.entities.Asset.list()
  });

  const getAssetName = (assetId) => {
    const asset = assets.find(a => a.id === assetId);
    return asset ? asset.symbol : 'N/A';
  };

  const topGainers = [...holdings]
    .filter(h => h.unrealized_gain_loss_percent > 0)
    .sort((a, b) => b.unrealized_gain_loss_percent - a.unrealized_gain_loss_percent)
    .slice(0, 3);

  const topLosers = [...holdings]
    .filter(h => h.unrealized_gain_loss_percent < 0)
    .sort((a, b) => a.unrealized_gain_loss_percent - b.unrealized_gain_loss_percent)
    .slice(0, 3);

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Top Gewinner */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            Top Gewinner
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topGainers.length === 0 ? (
            <p className="text-sm text-slate-500">Keine Daten</p>
          ) : (
            <div className="space-y-3">
              {topGainers.map(holding => (
                <div key={holding.id} className="flex items-center justify-between">
                  <span className="font-medium text-slate-900">{getAssetName(holding.asset_id)}</span>
                  <span className="text-emerald-600 font-semibold">
                    +{holding.unrealized_gain_loss_percent.toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Verlierer */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-600" />
            Top Verlierer
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topLosers.length === 0 ? (
            <p className="text-sm text-slate-500">Keine Daten</p>
          ) : (
            <div className="space-y-3">
              {topLosers.map(holding => (
                <div key={holding.id} className="flex items-center justify-between">
                  <span className="font-medium text-slate-900">{getAssetName(holding.asset_id)}</span>
                  <span className="text-red-600 font-semibold">
                    {holding.unrealized_gain_loss_percent.toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}