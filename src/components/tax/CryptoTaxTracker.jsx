import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, AlertTriangle } from 'lucide-react';

export default function CryptoTaxTracker() {
  const { data: cryptoHoldings } = useQuery({
    queryKey: ['cryptoHoldings'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.CryptoHolding.filter({
        user_email: user.email
      }, '-current_value_usd');
    }
  });

  if (!cryptoHoldings || cryptoHoldings.length === 0) {
    return <div className="p-4 text-slate-500">Keine Kryptowährungen erfasst</div>;
  }

  const totalValue = cryptoHoldings.reduce((sum, c) => sum + (c.total_value_usd || 0), 0);
  const totalGainLoss = cryptoHoldings.reduce((sum, c) => sum + (c.unrealized_gain_loss || 0), 0);
  const reportable = cryptoHoldings.filter(c => c.is_reportable).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-slate-500 font-light">Gesamtwert</div>
            <div className="text-2xl font-light mt-2">${totalValue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-slate-500 font-light">Unrealisierte Gewinne/Verluste</div>
            <div className={`text-2xl font-light mt-2 ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${totalGainLoss.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-slate-500 font-light">Meldepflichtig</div>
            <div className="text-2xl font-light mt-2 text-orange-600">{reportable}/{cryptoHoldings.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="holdings" className="w-full">
        <TabsList>
          <TabsTrigger value="holdings">Bestände</TabsTrigger>
          <TabsTrigger value="tax_treatment">Steuerliche Behandlung</TabsTrigger>
          <TabsTrigger value="reporting">Meldepflichten</TabsTrigger>
        </TabsList>

        <TabsContent value="holdings">
          <div className="space-y-2">
            {cryptoHoldings.map(holding => (
              <Card key={holding.id}>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-light text-sm">{holding.asset_name} ({holding.ticker})</p>
                      <p className="text-xs text-slate-500">{holding.quantity} @ ${(holding.current_price_usd).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-light text-sm">${holding.total_value_usd?.toLocaleString()}</p>
                      <p className={`text-xs ${holding.unrealized_gain_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {holding.unrealized_gain_loss >= 0 ? '+' : ''}{holding.unrealized_gain_loss?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tax_treatment">
          <div className="space-y-2">
            {cryptoHoldings.map(holding => (
              <Card key={holding.id} className={holding.is_long_term ? '' : 'border-orange-200 bg-orange-50'}>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-light text-sm">{holding.asset_name}</p>
                      <p className="text-xs text-slate-500">
                        {holding.is_long_term ? '✓ Langfristig' : '⚠ Kurzfristig'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-light text-sm text-slate-700">{holding.tax_treatment}</p>
                      <p className="text-xs text-slate-500">{holding.holding_period_days} Tage</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reporting">
          <div className="space-y-2">
            {cryptoHoldings.filter(c => c.is_reportable).map(holding => (
              <Card key={holding.id} className="border-red-200 bg-red-50">
                <CardContent className="pt-4">
                  <div className="flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-light text-sm">{holding.asset_name}</p>
                      <p className="text-xs text-slate-600">
                        Meldepflichtig: {holding.exchange} ({holding.country_of_exchange})
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        CRS/FATCA Meldung erforderlich
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}