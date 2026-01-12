import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Plus, Lock } from 'lucide-react';
import CryptoFormDialog from '@/components/wealth/CryptoFormDialog';

export default function Cryptocurrencies() {
  const [showDialog, setShowDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['assets_crypto'],
    queryFn: async () => {
      const all = await base44.entities.Asset.list();
      return all.filter(a => a.asset_class === 'CRYPTO').sort((a, b) => (b.current_value || 0) - (a.current_value || 0));
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Asset.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets_crypto'] });
      setShowDialog(false);
    },
  });

  const totalValue = assets.reduce((sum, a) => sum + (a.current_value || 0), 0);

  if (isLoading) {
    return <div className="p-6 text-center text-slate-600">Wird geladen...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Kryptowährungen</h1>
          <p className="text-slate-600 mt-1">Verwalte deine Krypto-Bestände und Wallets</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Neues Asset
        </Button>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">Gesamtwert Krypto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {totalValue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
          </div>
          <p className="text-xs text-slate-500 mt-2">{assets.length} verschiedene Coins</p>
        </CardContent>
      </Card>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {assets.map(asset => {
          const costBasis = asset.purchase_price_avg * asset.quantity;
          const gainLoss = (asset.current_value || 0) - costBasis;
          const gainLossPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;
          
          // Prüfe Haltefrist
          const holdingDays = asset.tax_holding_period_start 
            ? Math.floor((new Date() - new Date(asset.tax_holding_period_start)) / (1000 * 60 * 60 * 24))
            : 0;
          const isTaxFree = holdingDays > 365;

          return (
            <Card key={asset.id} className="relative overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{asset.symbol.toUpperCase()}</CardTitle>
                    <p className="text-xs text-slate-600 mt-1">{asset.name}</p>
                  </div>
                  {isTaxFree && (
                    <Badge className="bg-green-100 text-green-800">Steuerfrei</Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Menge & Wert */}
                <div>
                  <p className="text-xs text-slate-600">Bestand</p>
                  <p className="font-semibold text-slate-900">{asset.quantity} {asset.symbol.toUpperCase()}</p>
                </div>

                {/* Kurse */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-slate-600">Aktueller Kurs</p>
                    <p className="font-semibold">
                      {(asset.current_price || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Gesamtwert</p>
                    <p className="font-bold text-slate-900">
                      {(asset.current_value || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </p>
                  </div>
                </div>

                {/* Performance */}
                <div className={`p-2 rounded-lg ${gainLoss >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  <div className="flex items-center gap-2">
                    {gainLoss >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <span className="font-semibold">{gainLossPercent.toFixed(2)}%</span>
                  </div>
                  <p className="text-xs mt-1">
                    {gainLoss >= 0 ? '+' : ''}{gainLoss.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  </p>
                </div>

                {/* Haltefrist */}
                <div className="text-xs text-slate-600 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  {isTaxFree ? (
                    <span className="text-green-600">Steuerfrei ab {new Date(asset.tax_holding_period_start).toLocaleDateString('de-DE')}</span>
                  ) : (
                    <span>Noch {365 - holdingDays} Tage bis Steuerbefreiung</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1 text-xs">Kaufen</Button>
                  <Button variant="outline" size="sm" className="flex-1 text-xs">Verkaufen</Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {assets.length === 0 && (
        <Card className="text-center py-12">
          <p className="text-slate-600">Keine Kryptowährungen hinzugefügt</p>
          <Button onClick={() => setShowDialog(true)} className="mt-4 gap-2">
            <Plus className="w-4 h-4" />
            Erste Kryptowährung hinzufügen
          </Button>
        </Card>
      )}

      {/* Dialog */}
      <CryptoFormDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        onSubmit={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
      />
    </div>
  );
}