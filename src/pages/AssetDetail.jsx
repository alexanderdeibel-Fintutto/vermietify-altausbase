import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AssetDetail() {
  const { assetId } = useParams();

  const { data: asset, isLoading: assetLoading } = useQuery({
    queryKey: ['asset', assetId],
    queryFn: async () => {
      const assets = await base44.entities.Asset.list();
      return assets.find(a => a.id === assetId);
    }
  });

  const { data: holdings = [] } = useQuery({
    queryKey: ['asset-holdings', assetId],
    queryFn: () => base44.entities.AssetHolding.filter({ asset_id: assetId })
  });

  const { data: prices = [] } = useQuery({
    queryKey: ['asset-prices', assetId],
    queryFn: () => base44.entities.AssetPrice.filter({ asset_id: assetId }, '-price_date', 365)
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['asset-transactions', assetId],
    queryFn: async () => {
      const allTx = await base44.entities.AssetTransaction.list();
      return allTx.filter(tx => tx.asset_id === assetId).sort((a, b) => 
        new Date(b.transaction_date) - new Date(a.transaction_date)
      );
    }
  });

  if (assetLoading) {
    return <div className="p-8 text-center text-slate-500">Lädt...</div>;
  }

  if (!asset) {
    return <div className="p-8 text-center text-slate-500">Asset nicht gefunden</div>;
  }

  const totalHoldings = holdings.reduce((sum, h) => sum + h.quantity, 0);
  const totalValue = holdings.reduce((sum, h) => sum + (h.current_value || 0), 0);
  const totalCost = holdings.reduce((sum, h) => sum + h.total_cost_basis, 0);
  const totalGL = totalValue - totalCost;
  const totalGLPercent = totalCost > 0 ? (totalGL / totalCost) * 100 : 0;

  const chartData = prices.map(p => ({
    date: p.price_date,
    price: p.close_price
  })).reverse();

  const currentPrice = prices.length > 0 ? prices[0].close_price : 0;
  const priceChange = prices.length > 1 
    ? ((prices[0].close_price - prices[1].close_price) / prices[1].close_price) * 100 
    : 0;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: asset.currency || 'EUR'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={createPageUrl('AssetManagement')}>
          <ArrowLeft className="w-6 h-6 text-slate-600 hover:text-slate-900" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">{asset.symbol}</h1>
          <p className="text-slate-600">{asset.name}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-slate-600 mb-1">Aktueller Kurs</div>
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(currentPrice)}
            </div>
            <div className={`text-sm font-medium flex items-center gap-1 ${
              priceChange >= 0 ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {priceChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-slate-600 mb-1">Bestände</div>
            <div className="text-2xl font-bold text-slate-900">
              {totalHoldings.toFixed(4)}
            </div>
            <div className="text-sm text-slate-500">Stück</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-slate-600 mb-1">Gesamtwert</div>
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(totalValue)}
            </div>
            <div className="text-sm text-slate-500">
              Kosten: {formatCurrency(totalCost)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-slate-600 mb-1">Gewinn/Verlust</div>
            <div className={`text-2xl font-bold ${totalGL >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {totalGL >= 0 ? '+' : ''}{formatCurrency(totalGL)}
            </div>
            <div className={`text-sm font-medium ${totalGL >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {totalGLPercent >= 0 ? '+' : ''}{totalGLPercent.toFixed(2)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kurs-Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Kursentwicklung (12 Monate)</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="text-center text-slate-500 py-8">Keine Kursdaten verfügbar</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('de-DE', { month: 'short' })}
                  stroke="#64748b"
                />
                <YAxis 
                  tickFormatter={formatCurrency}
                  stroke="#64748b"
                />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  labelFormatter={(date) => new Date(date).toLocaleDateString('de-DE')}
                />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Transaktionshistorie */}
      <Card>
        <CardHeader>
          <CardTitle>Transaktionshistorie</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-center text-slate-500 py-8">Keine Transaktionen</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Datum</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Typ</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-600">Menge</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-600">Kurs</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-600">Betrag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm text-slate-900">
                        {new Date(tx.transaction_date).toLocaleDateString('de-DE')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                          tx.transaction_type === 'buy' ? 'bg-emerald-100 text-emerald-700' :
                          tx.transaction_type === 'sell' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {tx.transaction_type === 'buy' ? 'Kauf' :
                           tx.transaction_type === 'sell' ? 'Verkauf' :
                           tx.transaction_type === 'dividend' ? 'Dividende' : tx.transaction_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-slate-900">
                        {tx.quantity.toFixed(4)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-slate-900">
                        {formatCurrency(tx.price_per_unit)}
                      </td>
                      <td className={`px-4 py-3 text-sm text-right font-medium ${
                        tx.transaction_type === 'sell' ? 'text-emerald-600' : 'text-slate-900'
                      }`}>
                        {formatCurrency(tx.net_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}