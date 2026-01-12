import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Plus, Search } from 'lucide-react';
import StockFormDialog from '@/components/wealth/StockFormDialog';

export default function StocksAndETFs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const queryClient = useQueryClient();

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['assets_stocks'],
    queryFn: async () => {
      const all = await base44.entities.Asset.list();
      return all.filter(a => ['STOCK', 'ETF', 'MUTUAL_FUND'].includes(a.asset_class));
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Asset.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets_stocks'] });
      setShowDialog(false);
    },
  });

  const filtered = assets.filter(a =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.symbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.isin?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalValue = filtered.reduce((sum, a) => sum + (a.current_value || 0), 0);

  if (isLoading) {
    return <div className="p-6 text-center text-slate-600">Wird geladen...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Aktien & ETFs</h1>
          <p className="text-slate-600 mt-1">Verwalte deine Wertpapiere und Fonds</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Neues Asset
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Gesamtwert</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalValue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Anzahl Positionen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filtered.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Durchschnittliche Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +2.5%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
            <Search className="w-4 h-4 text-slate-400" />
            <Input
              placeholder="Nach Asset, Symbol oder ISIN suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 bg-transparent"
            />
          </div>
        </CardHeader>
      </Card>

      {/* Assets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Positionen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Asset</th>
                  <th className="text-center py-3 px-4 font-medium text-slate-600">ISIN</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600">Menge</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600">Ø-Kaufpreis</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600">Aktueller Kurs</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600">Gesamtwert</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600">Performance</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(asset => {
                  const costBasis = asset.purchase_price_avg * asset.quantity;
                  const gainLoss = (asset.current_value || 0) - costBasis;
                  const gainLossPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;

                  return (
                    <tr key={asset.id} className="border-b hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedAsset(asset)}>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-slate-900">{asset.name}</p>
                          <p className="text-xs text-slate-500">{asset.symbol}</p>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4 font-mono text-xs">{asset.isin}</td>
                      <td className="text-right py-3 px-4">{asset.quantity}</td>
                      <td className="text-right py-3 px-4">
                        {(asset.purchase_price_avg || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                      </td>
                      <td className="text-right py-3 px-4 font-medium">
                        {(asset.current_price || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                      </td>
                      <td className="text-right py-3 px-4 font-medium">
                        {(asset.current_value || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                      </td>
                      <td className="text-right py-3 px-4">
                        <div className={`flex items-center justify-end gap-1 ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {gainLoss >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          <span className="font-medium">{gainLossPercent.toFixed(2)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog */}
      <StockFormDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        onSubmit={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
      />
    </div>
  );
}