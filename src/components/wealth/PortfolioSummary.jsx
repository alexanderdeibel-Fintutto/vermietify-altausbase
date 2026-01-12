import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function PortfolioSummary({ portfolioId }) {
  const { data: assets = [] } = useQuery({
    queryKey: ['assets', portfolioId],
    queryFn: async () => {
      const all = await base44.entities.Asset.list();
      return all.filter(a => !portfolioId || a.portfolio_id === portfolioId);
    },
  });

  const { data: portfolio } = useQuery({
    queryKey: ['portfolio', portfolioId],
    queryFn: async () => {
      if (!portfolioId) return null;
      const portfolios = await base44.entities.Portfolio.filter({ id: portfolioId });
      return portfolios[0];
    },
    enabled: !!portfolioId,
  });

  const totalValue = assets.reduce((sum, a) => sum + (a.current_value || 0), 0);
  const totalCost = assets.reduce((sum, a) => sum + (a.purchase_price_avg * a.quantity), 0);
  const gainLoss = totalValue - totalCost;
  const gainLossPercent = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;

  // Top 5 Holdings
  const topHoldings = assets.sort((a, b) => (b.current_value || 0) - (a.current_value || 0)).slice(0, 5);

  // Asset-Klassen Verteilung
  const assetClassBreakdown = assets.reduce((acc, asset) => {
    const existing = acc.find(a => a.class === asset.asset_class);
    if (existing) {
      existing.value += asset.current_value || 0;
      existing.count += 1;
    } else {
      acc.push({
        class: asset.asset_class,
        value: asset.current_value || 0,
        count: 1,
      });
    }
    return acc;
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">
            {portfolio ? portfolio.name : 'Gesamtes Vermögen'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs text-slate-600">Gesamtwert</p>
                <p className="text-3xl font-bold text-slate-900">
                  {totalValue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                </p>
              </div>
              <div className={`text-right ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                <div className="flex items-center justify-end gap-1 mb-1">
                  {gainLoss >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span className="font-semibold">{gainLossPercent.toFixed(2)}%</span>
                </div>
                <p className="text-sm font-bold">
                  {gainLoss.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Asset Classes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Asset-Klassen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {assetClassBreakdown.map(item => (
              <div key={item.class} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.class}</p>
                  <p className="text-xs text-slate-600">{item.count} Position{item.count !== 1 ? 'en' : ''}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {(item.value / totalValue * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-slate-600">
                    {item.value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Holdings */}
      {topHoldings.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Top Holdings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topHoldings.map(asset => (
                <div key={asset.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{asset.name}</p>
                    <p className="text-xs text-slate-600">{asset.quantity} Anteile</p>
                  </div>
                  <div className="text-right ml-2">
                    <Badge variant="outline" className="text-xs">
                      {((asset.current_value || 0) / totalValue * 100).toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}