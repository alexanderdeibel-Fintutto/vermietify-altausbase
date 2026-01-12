import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';

export default function AssetDetail() {
  const location = useLocation();
  const assetId = location.pathname.split('/').pop();

  const { data: asset, isLoading: assetLoading } = useQuery({
    queryKey: ['asset', assetId],
    queryFn: async () => {
      const assets = await base44.entities.Asset.list();
      return assets.find(a => a.id === assetId);
    },
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions', assetId],
    queryFn: async () => {
      const all = await base44.entities.AssetTransaction.list();
      return all.filter(tx => tx.asset_id === assetId).sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));
    },
    enabled: !!assetId,
  });

  const { data: valuations = [] } = useQuery({
    queryKey: ['valuations', assetId],
    queryFn: async () => {
      const all = await base44.entities.AssetValuation.list('-valuation_date', 365);
      return all.filter(v => v.asset_id === assetId).reverse();
    },
    enabled: !!assetId,
  });

  const { data: dividends = [] } = useQuery({
    queryKey: ['dividends', assetId],
    queryFn: async () => {
      const all = await base44.entities.Dividend.list();
      return all.filter(d => d.asset_id === assetId).sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));
    },
    enabled: !!assetId,
  });

  if (assetLoading) {
    return <div className="p-6 text-center text-slate-600">Wird geladen...</div>;
  }

  if (!asset) {
    return <div className="p-6 text-center text-red-600">Asset nicht gefunden</div>;
  }

  const costBasis = asset.purchase_price_avg * asset.quantity;
  const gainLoss = (asset.current_value || 0) - costBasis;
  const gainLossPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;
  const totalDividends = dividends.reduce((sum, d) => sum + (d.amount_net || 0), 0);

  // Performance-Daten
  const performanceData = valuations.map(v => ({
    date: new Date(v.valuation_date).toLocaleDateString('de-DE'),
    price: v.price,
  }));

  // Buy/Sell Transaktionen
  const transactionData = transactions.map(tx => ({
    date: new Date(tx.transaction_date).toLocaleDateString('de-DE'),
    type: tx.transaction_type,
    quantity: Math.abs(tx.quantity),
    price: tx.price_per_unit,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{asset.name}</h1>
          <div className="flex gap-2 mt-2">
            <Badge>{asset.asset_class}</Badge>
            {asset.symbol && <Badge variant="outline">{asset.symbol}</Badge>}
            {asset.isin && <Badge variant="outline">{asset.isin}</Badge>}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Aktueller Kurs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(asset.current_price || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Menge</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{asset.quantity}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Aktueller Wert</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(asset.current_value || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold flex items-center gap-1 ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {gainLoss >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              {gainLossPercent.toFixed(2)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gain/Loss & Dividends */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Gewinn/Verlust</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {gainLoss.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Gesamte Dividenden</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totalDividends.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Anschaffungskosten</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{costBasis.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</div>
          </CardContent>
        </Card>
      </div>

      {/* Kursverlauf */}
      {performanceData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Kursverlauf (letzte 12 Monate)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} />
                <Line type="monotone" dataKey="price" stroke="#3b82f6" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Transaktionen */}
      <Card>
        <CardHeader>
          <CardTitle>Transaktionshistorie</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4 font-medium text-slate-600">Datum</th>
                  <th className="text-left py-2 px-4 font-medium text-slate-600">Typ</th>
                  <th className="text-right py-2 px-4 font-medium text-slate-600">Menge</th>
                  <th className="text-right py-2 px-4 font-medium text-slate-600">Preis</th>
                  <th className="text-right py-2 px-4 font-medium text-slate-600">Gesamtbetrag</th>
                  {transactions.some(t => t.realized_gain_loss) && (
                    <th className="text-right py-2 px-4 font-medium text-slate-600">Gewinn/Verlust</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => (
                  <tr key={tx.id} className="border-b hover:bg-slate-50">
                    <td className="py-2 px-4">{new Date(tx.transaction_date).toLocaleDateString('de-DE')}</td>
                    <td className="py-2 px-4">
                      <Badge variant={tx.transaction_type === 'BUY' ? 'default' : 'secondary'}>
                        {tx.transaction_type}
                      </Badge>
                    </td>
                    <td className="text-right py-2 px-4">{Math.abs(tx.quantity)}</td>
                    <td className="text-right py-2 px-4">{(tx.price_per_unit || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</td>
                    <td className="text-right py-2 px-4 font-medium">{(Math.abs(tx.total_amount) || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</td>
                    {tx.realized_gain_loss !== undefined && (
                      <td className={`text-right py-2 px-4 font-medium ${(tx.realized_gain_loss || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {(tx.realized_gain_loss || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Dividenden */}
      {dividends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Dividenden & Ausschüttungen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dividends.map(div => (
                <div key={div.id} className="flex justify-between items-center p-3 bg-slate-50 rounded border">
                  <div className="text-sm">
                    <p className="font-medium text-slate-900">{div.dividend_type}</p>
                    <p className="text-xs text-slate-600">{new Date(div.payment_date).toLocaleDateString('de-DE')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{(div.amount_net || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
                    <p className="text-xs text-red-600">Steuer: {(div.tax_withheld || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
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