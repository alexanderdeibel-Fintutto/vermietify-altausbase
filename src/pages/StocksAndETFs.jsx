import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Plus, ShoppingCart, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function StocksAndETFs() {
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [formData, setFormData] = useState({
    portfolio_id: '',
    asset_class: 'STOCK',
    name: '',
    isin: '',
    symbol: '',
    quantity: 0,
    price_per_unit: 0,
    fees: 0,
    transaction_date: new Date().toISOString().split('T')[0]
  });

  const queryClient = useQueryClient();

  const { data: assets = [] } = useQuery({
    queryKey: ['assets', 'securities'],
    queryFn: async () => {
      const all = await base44.entities.Asset.list();
      return all.filter(a => ['STOCK', 'ETF', 'MUTUAL_FUND'].includes(a.asset_class));
    }
  });

  const { data: portfolios = [] } = useQuery({
    queryKey: ['portfolios'],
    queryFn: () => base44.entities.Portfolio.list()
  });

  const buyMutation = useMutation({
    mutationFn: async (data) => {
      // 1. Asset erstellen oder aktualisieren
      let asset = assets.find(a => a.isin === data.isin);
      
      if (!asset) {
        asset = await base44.entities.Asset.create({
          portfolio_id: data.portfolio_id,
          asset_class: data.asset_class,
          name: data.name,
          isin: data.isin,
          symbol: data.symbol,
          quantity: data.quantity,
          purchase_price_avg: data.price_per_unit,
          api_source: 'ALPHA_VANTAGE'
        });
      } else {
        // Update quantity und avg price
        const newQuantity = asset.quantity + data.quantity;
        const newAvgPrice = ((asset.quantity * asset.purchase_price_avg) + (data.quantity * data.price_per_unit)) / newQuantity;
        
        await base44.entities.Asset.update(asset.id, {
          quantity: newQuantity,
          purchase_price_avg: newAvgPrice
        });
      }
      
      // 2. Transaktion erfassen
      await base44.entities.AssetTransaction.create({
        asset_id: asset.id,
        transaction_type: 'BUY',
        transaction_date: data.transaction_date,
        quantity: data.quantity,
        price_per_unit: data.price_per_unit,
        total_amount: (data.quantity * data.price_per_unit) + data.fees,
        fees: data.fees,
        tax_relevant: false,
        tax_year: new Date(data.transaction_date).getFullYear()
      });
      
      return asset;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['assets']);
      toast.success('Kauf erfasst');
      setBuyDialogOpen(false);
      setFormData({
        portfolio_id: '',
        asset_class: 'STOCK',
        name: '',
        isin: '',
        symbol: '',
        quantity: 0,
        price_per_unit: 0,
        fees: 0,
        transaction_date: new Date().toISOString().split('T')[0]
      });
    }
  });

  const sellMutation = useMutation({
    mutationFn: async ({ asset, quantity, price, fees }) => {
      // FIFO-Berechnung
      const fifoResult = await base44.functions.invoke('calculateFIFOGainLoss', {
        asset_id: asset.id,
        sell_quantity: quantity,
        sell_price: price
      });
      
      const gainLoss = fifoResult.data.gain_loss - fees;
      
      // Transaktion erfassen
      await base44.entities.AssetTransaction.create({
        asset_id: asset.id,
        transaction_type: 'SELL',
        transaction_date: new Date().toISOString().split('T')[0],
        quantity: -quantity,
        price_per_unit: price,
        total_amount: (quantity * price) - fees,
        fees,
        tax_relevant: !fifoResult.data.is_tax_free,
        tax_year: new Date().getFullYear(),
        realized_gain_loss: gainLoss
      });
      
      // Asset-Menge reduzieren
      await base44.entities.Asset.update(asset.id, {
        quantity: asset.quantity - quantity
      });
      
      return { gainLoss, isTaxFree: fifoResult.data.is_tax_free };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['assets']);
      toast.success(`Verkauf erfasst. ${data.isTaxFree ? 'Steuerfrei!' : `Gewinn/Verlust: ${data.gainLoss.toFixed(2)}€`}`);
      setSellDialogOpen(false);
      setSelectedAsset(null);
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-slate-900">Aktien & ETFs</h1>
          <p className="text-slate-600 mt-1">{assets.length} Positionen</p>
        </div>
        <Button onClick={() => setBuyDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Kauf hinzufügen
        </Button>
      </div>

      {/* Assets Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left p-4">Asset</th>
                  <th className="text-right p-4">Anzahl</th>
                  <th className="text-right p-4">Ø Kaufpreis</th>
                  <th className="text-right p-4">Aktuell</th>
                  <th className="text-right p-4">Gesamtwert</th>
                  <th className="text-right p-4">Performance</th>
                  <th className="text-right p-4">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {assets.map(asset => {
                  const gainLoss = (asset.current_value || 0) - ((asset.purchase_price_avg || 0) * asset.quantity);
                  const gainLossPercent = asset.purchase_price_avg > 0 
                    ? ((gainLoss / (asset.purchase_price_avg * asset.quantity)) * 100) 
                    : 0;
                  
                  return (
                    <tr key={asset.id} className="border-b hover:bg-slate-50">
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{asset.name}</p>
                          <p className="text-xs text-slate-500">{asset.isin || asset.symbol}</p>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {asset.asset_class}
                          </Badge>
                        </div>
                      </td>
                      <td className="text-right p-4">{asset.quantity.toFixed(4)}</td>
                      <td className="text-right p-4">{(asset.purchase_price_avg || 0).toFixed(2)}€</td>
                      <td className="text-right p-4">{(asset.current_price || 0).toFixed(2)}€</td>
                      <td className="text-right p-4 font-medium">{(asset.current_value || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</td>
                      <td className="text-right p-4">
                        <div className={gainLoss >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                          <div className="flex items-center justify-end gap-1">
                            {gainLoss >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            <span className="font-medium">{gainLoss >= 0 ? '+' : ''}{gainLossPercent.toFixed(2)}%</span>
                          </div>
                          <p className="text-xs">{gainLoss >= 0 ? '+' : ''}{gainLoss.toFixed(2)}€</p>
                        </div>
                      </td>
                      <td className="text-right p-4">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedAsset(asset);
                            setSellDialogOpen(true);
                          }}
                        >
                          Verkaufen
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

      {/* Buy Dialog */}
      <Dialog open={buyDialogOpen} onOpenChange={setBuyDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Wertpapier kaufen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Portfolio *</Label>
              <Select value={formData.portfolio_id} onValueChange={v => setFormData({...formData, portfolio_id: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Portfolio auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {portfolios.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Art *</Label>
              <Select value={formData.asset_class} onValueChange={v => setFormData({...formData, asset_class: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STOCK">Aktie</SelectItem>
                  <SelectItem value="ETF">ETF</SelectItem>
                  <SelectItem value="MUTUAL_FUND">Investmentfonds</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="z.B. Apple Inc."
                />
              </div>
              <div>
                <Label>ISIN</Label>
                <Input
                  value={formData.isin}
                  onChange={e => setFormData({...formData, isin: e.target.value})}
                  placeholder="US0378331005"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Symbol</Label>
                <Input
                  value={formData.symbol}
                  onChange={e => setFormData({...formData, symbol: e.target.value})}
                  placeholder="AAPL"
                />
              </div>
              <div>
                <Label>Kaufdatum *</Label>
                <Input
                  type="date"
                  value={formData.transaction_date}
                  onChange={e => setFormData({...formData, transaction_date: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Anzahl *</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={formData.quantity}
                  onChange={e => setFormData({...formData, quantity: parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <Label>Preis/Stück *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price_per_unit}
                  onChange={e => setFormData({...formData, price_per_unit: parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <Label>Gebühren</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.fees}
                  onChange={e => setFormData({...formData, fees: parseFloat(e.target.value)})}
                />
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg">
              <p className="text-sm text-slate-700">
                <span className="font-medium">Gesamt: </span>
                {((formData.quantity * formData.price_per_unit) + formData.fees).toFixed(2)}€
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setBuyDialogOpen(false)}>Abbrechen</Button>
              <Button 
                onClick={() => buyMutation.mutate(formData)}
                disabled={!formData.portfolio_id || !formData.name || formData.quantity <= 0}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Kauf erfassen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sell Dialog */}
      <Dialog open={sellDialogOpen} onOpenChange={setSellDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verkaufen: {selectedAsset?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Verfügbar: {selectedAsset?.quantity || 0} Stück</Label>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Anzahl *</Label>
                <Input
                  type="number"
                  step="0.0001"
                  max={selectedAsset?.quantity}
                  onChange={e => setFormData({...formData, quantity: parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <Label>Verkaufspreis *</Label>
                <Input
                  type="number"
                  step="0.01"
                  onChange={e => setFormData({...formData, price_per_unit: parseFloat(e.target.value)})}
                />
              </div>
            </div>

            <div>
              <Label>Gebühren</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.fees}
                onChange={e => setFormData({...formData, fees: parseFloat(e.target.value)})}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setSellDialogOpen(false)}>Abbrechen</Button>
              <Button 
                onClick={() => sellMutation.mutate({
                  asset: selectedAsset,
                  quantity: formData.quantity,
                  price: formData.price_per_unit,
                  fees: formData.fees
                })}
                disabled={!formData.quantity || formData.quantity > selectedAsset?.quantity}
              >
                Verkauf erfassen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}