import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { TrendingUp, TrendingDown, Eye, EyeOff, Share2 } from 'lucide-react';

const formatCurrency = (amount, currency = 'EUR') => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency
  }).format(amount);
};

export default function MobilePortfolioView({ userId }) {
  const [showValues, setShowValues] = useState(true);

  const { data: assets = [] } = useQuery({
    queryKey: ['portfolio', userId],
    queryFn: () => base44.entities.AssetPortfolio.filter({
      user_id: userId,
      status: 'active'
    }, '-created_date', 100) || []
  });

  const totalValue = assets.reduce((sum, a) => sum + (a.quantity * a.current_value), 0);
  const totalInvested = assets.reduce((sum, a) => sum + (a.quantity * a.purchase_price), 0);
  const totalGain = totalValue - totalInvested;
  const gainPercent = (totalGain / totalInvested) * 100;

  return (
    <div className="space-y-4 pb-20">
      {/* Header Card - Big Numbers */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-700">
        <CardContent className="p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm opacity-80">Gesamtwert</h2>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowValues(!showValues)}
              className="text-white hover:bg-white/10"
            >
              {showValues ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </Button>
          </div>
          
          {showValues ? (
            <>
              <p className="text-3xl font-bold">{formatCurrency(totalValue)}</p>
              <p className={`text-sm mt-2 ${gainPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {gainPercent >= 0 ? '+' : ''}{gainPercent.toFixed(1)}% ({formatCurrency(totalGain)})
              </p>
            </>
          ) : (
            <p className="text-3xl font-bold">●●●●●</p>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" className="text-xs h-8">+ Hinzufügen</Button>
        <Button variant="outline" className="text-xs h-8">
          <Share2 className="w-3 h-3 mr-1" /> Teilen
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="positions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="positions" className="text-xs">Positionen</TabsTrigger>
          <TabsTrigger value="categories" className="text-xs">Kategorien</TabsTrigger>
          <TabsTrigger value="alerts" className="text-xs">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="positions" className="space-y-2">
          {assets.slice(0, 10).map(asset => {
            const assetValue = asset.quantity * asset.current_value;
            const assetGain = assetValue - (asset.quantity * asset.purchase_price);
            const gainPercent = (assetGain / (asset.quantity * asset.purchase_price)) * 100;

            return (
              <Card key={asset.id} className="overflow-hidden">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm line-clamp-1">{asset.name}</p>
                      <p className="text-xs text-slate-500">{asset.quantity} × {formatCurrency(asset.current_value, asset.currency)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{formatCurrency(assetValue, asset.currency)}</p>
                      <p className={`text-xs ${gainPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {gainPercent >= 0 ? <TrendingUp className="w-3 h-3 inline mr-1" /> : <TrendingDown className="w-3 h-3 inline mr-1" />}
                        {gainPercent >= 0 ? '+' : ''}{gainPercent.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1">
                    <div
                      className="bg-slate-700 h-1 rounded-full"
                      style={{ width: `${Math.min((assetValue / totalValue) * 100, 100)}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="categories" className="space-y-2">
          {Object.entries(
            assets.reduce((acc, a) => {
              acc[a.asset_category] = (acc[a.asset_category] || 0) + (a.quantity * a.current_value);
              return acc;
            }, {})
          ).map(([category, value]) => (
            <Card key={category}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{category}</span>
                  <div className="text-right">
                    <p className="font-bold text-sm">{formatCurrency(value)}</p>
                    <p className="text-xs text-slate-500">{((value / totalValue) * 100).toFixed(1)}%</p>
                  </div>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1 mt-2">
                  <div
                    className="bg-blue-600 h-1 rounded-full"
                    style={{ width: `${(value / totalValue) * 100}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="alerts" className="text-center py-8">
          <p className="text-sm text-slate-500">Keine aktiven Alerts</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}