import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Edit, Trash2, Plus, TrendingUp, TrendingDown } from 'lucide-react';
import AssetTransactionDialog from '@/components/wealth/AssetTransactionDialog';

export default function PortfolioDetail() {
  const location = useLocation();
  const portfolioId = location.pathname.split('/').pop();
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const queryClient = useQueryClient();

  const { data: portfolio, isLoading: portfolioLoading } = useQuery({
    queryKey: ['portfolio', portfolioId],
    queryFn: async () => {
      const portfolios = await base44.entities.Portfolio.filter({ id: portfolioId });
      return portfolios[0];
    },
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['assets', portfolioId],
    queryFn: async () => {
      const all = await base44.entities.Asset.list();
      return all.filter(a => a.portfolio_id === portfolioId);
    },
    enabled: !!portfolioId,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions', portfolioId],
    queryFn: async () => {
      const all = await base44.entities.AssetTransaction.list();
      return all.filter(tx => {
        const asset = assets.find(a => a.id === tx.asset_id);
        return asset?.portfolio_id === portfolioId;
      });
    },
    enabled: assets.length > 0,
  });

  const deleteMutation = useMutation({
    mutationFn: (assetId) => base44.entities.Asset.delete(assetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets', portfolioId] });
    },
  });

  const totalValue = assets.reduce((sum, a) => sum + (a.current_value || 0), 0);
  const totalCost = assets.reduce((sum, a) => sum + (a.purchase_price_avg * a.quantity), 0);
  const gainLoss = totalValue - totalCost;
  const gainLossPercent = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;

  if (portfolioLoading) {
    return <div className="p-6 text-center text-slate-600">Wird geladen...</div>;
  }

  if (!portfolio) {
    return <div className="p-6 text-center text-red-600">Portfolio nicht gefunden</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{portfolio.name}</h1>
          <div className="flex gap-2 mt-2">
            <Badge variant="outline">{portfolio.portfolio_type}</Badge>
            <Badge variant="outline">{portfolio.broker_name}</Badge>
          </div>
        </div>
        <Button className="gap-2">
          <Edit className="w-4 h-4" />
          Bearbeiten
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Gesamtwert</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalValue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Gewinn/Verlust</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold flex items-center gap-2 ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {gainLoss >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              {gainLoss.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </div>
            <p className="text-xs text-slate-500 mt-1">{gainLossPercent.toFixed(2)}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Positionen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assets.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Assets Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Positionen</CardTitle>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Position hinzufügen
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Asset</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600">Menge</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600">Kurs</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600">Wert</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600">Performance</th>
                  <th className="text-center py-3 px-4 font-medium text-slate-600">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {assets.map(asset => {
                  const costBasis = asset.purchase_price_avg * asset.quantity;
                  const gain = (asset.current_value || 0) - costBasis;
                  const gainPercent = costBasis > 0 ? (gain / costBasis) * 100 : 0;

                  return (
                    <tr key={asset.id} className="border-b hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-slate-900">{asset.name}</p>
                          <p className="text-xs text-slate-500">{asset.symbol}</p>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4">{asset.quantity}</td>
                      <td className="text-right py-3 px-4">{(asset.current_price || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</td>
                      <td className="text-right py-3 px-4 font-medium">{(asset.current_value || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</td>
                      <td className={`text-right py-3 px-4 font-medium ${gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {gainPercent.toFixed(2)}%
                      </td>
                      <td className="text-center py-3 px-4 space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedAsset(asset);
                            setShowTransactionDialog(true);
                          }}
                        >
                          +/-
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteMutation.mutate(asset.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Letzte Transaktionen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {transactions.slice(0, 10).map(tx => (
              <div key={tx.id} className="flex justify-between items-center p-3 bg-slate-50 rounded border">
                <div className="text-sm">
                  <p className="font-medium text-slate-900">{assets.find(a => a.id === tx.asset_id)?.name}</p>
                  <p className="text-xs text-slate-600">{new Date(tx.transaction_date).toLocaleDateString('de-DE')} - {tx.transaction_type}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{tx.quantity} @ {(tx.price_per_unit || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
                  {tx.realized_gain_loss && (
                    <p className={`text-xs font-semibold ${tx.realized_gain_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(tx.realized_gain_loss || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <AssetTransactionDialog
        open={showTransactionDialog}
        onOpenChange={setShowTransactionDialog}
        asset={selectedAsset}
      />
    </div>
  );
}