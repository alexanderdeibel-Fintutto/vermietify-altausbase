import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { differenceInDays, addYears, format } from 'date-fns';

export default function Cryptocurrencies() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [transactionType, setTransactionType] = useState('BUY');
  const [selectedAsset, setSelectedAsset] = useState(null);

  const queryClient = useQueryClient();

  const { data: cryptoAssets = [] } = useQuery({
    queryKey: ['assets', 'crypto'],
    queryFn: async () => {
      const all = await base44.entities.Asset.list();
      return all.filter(a => a.asset_class === 'CRYPTO');
    }
  });

  const { data: portfolios = [] } = useQuery({
    queryKey: ['portfolios'],
    queryFn: () => base44.entities.Portfolio.list()
  });

  const addMutation = useMutation({
    mutationFn: async (data) => {
      if (data.type === 'BUY') {
        // Asset erstellen oder aktualisieren
        let asset = cryptoAssets.find(a => a.symbol.toLowerCase() === data.symbol.toLowerCase());
        
        if (!asset) {
          asset = await base44.entities.Asset.create({
            portfolio_id: data.portfolio_id,
            asset_class: 'CRYPTO',
            name: data.name,
            symbol: data.symbol,
            quantity: data.quantity,
            purchase_price_avg: data.price_per_unit,
            tax_holding_period_start: data.transaction_date,
            api_source: 'COINGECKO'
          });
        } else {
          const newQuantity = asset.quantity + data.quantity;
          const newAvgPrice = ((asset.quantity * asset.purchase_price_avg) + (data.quantity * data.price_per_unit)) / newQuantity;
          
          await base44.entities.Asset.update(asset.id, {
            quantity: newQuantity,
            purchase_price_avg: newAvgPrice
          });
        }
        
        // Transaktion erfassen
        await base44.entities.AssetTransaction.create({
          asset_id: asset.id,
          transaction_type: 'BUY',
          transaction_date: data.transaction_date,
          quantity: data.quantity,
          price_per_unit: data.price_per_unit,
          total_amount: (data.quantity * data.price_per_unit) + (data.fees || 0),
          fees: data.fees || 0,
          tax_relevant: false,
          tax_year: new Date(data.transaction_date).getFullYear()
        });
      }
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['assets']);
      toast.success('Transaktion erfasst');
      setDialogOpen(false);
    }
  });

  const getTaxStatus = (asset) => {
    if (!asset.tax_holding_period_start) return null;
    
    const daysSincePurchase = differenceInDays(new Date(), new Date(asset.tax_holding_period_start));
    const taxFreeDate = addYears(new Date(asset.tax_holding_period_start), 1);
    
    if (daysSincePurchase >= 365) {
      return { isTaxFree: true, message: 'Steuerfrei' };
    }
    
    return { 
      isTaxFree: false, 
      message: `Steuerfrei ab ${format(taxFreeDate, 'dd.MM.yyyy')}`,
      daysRemaining: 365 - daysSincePurchase
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-slate-900">Kryptowährungen</h1>
          <p className="text-slate-600 mt-1">{cryptoAssets.length} Positionen</p>
        </div>
        <Button onClick={() => {
          setTransactionType('BUY');
          setDialogOpen(true);
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Kauf hinzufügen
        </Button>
      </div>

      {/* Crypto Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cryptoAssets.map(asset => {
          const gainLoss = (asset.current_value || 0) - ((asset.purchase_price_avg || 0) * asset.quantity);
          const gainLossPercent = asset.purchase_price_avg > 0 
            ? ((gainLoss / (asset.purchase_price_avg * asset.quantity)) * 100) 
            : 0;
          const taxStatus = getTaxStatus(asset);
          
          return (
            <Card key={asset.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{asset.name}</CardTitle>
                  {taxStatus?.isTaxFree ? (
                    <Badge className="bg-emerald-100 text-emerald-700">
                      <Clock className="w-3 h-3 mr-1" />
                      Steuerfrei
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      {taxStatus?.daysRemaining} Tage
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-slate-500">{asset.symbol}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-600">Anzahl</p>
                    <p className="font-medium">{asset.quantity.toFixed(8)}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Kurs</p>
                    <p className="font-medium">{(asset.current_price || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs text-slate-600">Gesamtwert</p>
                  <p className="text-xl font-bold">{(asset.current_value || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
                </div>

                <div className={`flex items-center gap-2 ${gainLoss >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {gainLoss >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span className="font-medium">{gainLoss >= 0 ? '+' : ''}{gainLossPercent.toFixed(2)}%</span>
                  <span className="text-sm">({gainLoss >= 0 ? '+' : ''}{gainLoss.toFixed(2)}€)</span>
                </div>

                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    setSelectedAsset(asset);
                    setTransactionType('SELL');
                    setDialogOpen(true);
                  }}
                >
                  Verkaufen
                </Button>
              </CardContent>
            </Card>
          );
        })}

        {cryptoAssets.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <p className="text-slate-500 mb-4">Keine Kryptowährungen vorhanden</p>
              <Button onClick={() => {
                setTransactionType('BUY');
                setDialogOpen(true);
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Erste Position hinzufügen
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Transaction Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{transactionType === 'BUY' ? 'Krypto kaufen' : `Verkaufen: ${selectedAsset?.name}`}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {transactionType === 'BUY' && (
              <>
                <div>
                  <Label>Portfolio *</Label>
                  <Input placeholder="z.B. Coinbase Wallet" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Name *</Label>
                    <Input placeholder="Bitcoin" />
                  </div>
                  <div>
                    <Label>Symbol *</Label>
                    <Input placeholder="BTC" />
                  </div>
                </div>
              </>
            )}
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Anzahl *</Label>
                <Input type="number" step="0.00000001" />
              </div>
              <div>
                <Label>Preis/Stück *</Label>
                <Input type="number" step="0.01" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Gebühren</Label>
                <Input type="number" step="0.01" defaultValue="0" />
              </div>
              <div>
                <Label>Datum *</Label>
                <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Abbrechen</Button>
              <Button>Erfassen</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}