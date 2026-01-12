import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function CryptoFormDialog({ open, onOpenChange, onSubmit, isLoading, portfolio_id }) {
  const [formData, setFormData] = useState({
    portfolio_id: portfolio_id || '',
    asset_class: 'CRYPTO',
    name: '',
    symbol: '',
    quantity: '',
    purchase_price_avg: '',
    current_price: '',
    wallet_type: 'HOT_WALLET',
    exchange_name: '',
    api_source: 'COINGECKO',
    tax_holding_period_start: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      quantity: parseFloat(formData.quantity),
      purchase_price_avg: parseFloat(formData.purchase_price_avg),
      current_price: parseFloat(formData.current_price),
      current_value: parseFloat(formData.quantity) * parseFloat(formData.current_price),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Neue Kryptowährung hinzufügen</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="z.B. Bitcoin"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="symbol">Symbol *</Label>
            <Input
              id="symbol"
              placeholder="z.B. BTC"
              value={formData.symbol}
              onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="quantity">Menge *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.00000001"
                placeholder="0.5"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="purchase_price">Ø-Kaufpreis (EUR) *</Label>
              <Input
                id="purchase_price"
                type="number"
                step="0.01"
                placeholder="42000.00"
                value={formData.purchase_price_avg}
                onChange={(e) => setFormData({ ...formData, purchase_price_avg: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="current_price">Aktueller Kurs (EUR) *</Label>
            <Input
              id="current_price"
              type="number"
              step="0.01"
              placeholder="45000.00"
              value={formData.current_price}
              onChange={(e) => setFormData({ ...formData, current_price: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="wallet_type">Lagerungsart</Label>
            <Select value={formData.wallet_type} onValueChange={(value) => setFormData({ ...formData, wallet_type: value })}>
              <SelectTrigger id="wallet_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HOT_WALLET">Hot Wallet (Online)</SelectItem>
                <SelectItem value="COLD_WALLET">Cold Wallet (Offline)</SelectItem>
                <SelectItem value="EXCHANGE">Exchange</SelectItem>
                <SelectItem value="DEFI">DeFi Protokoll</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="exchange_name">Exchange/Plattform</Label>
            <Input
              id="exchange_name"
              placeholder="z.B. Coinbase, Kraken"
              value={formData.exchange_name}
              onChange={(e) => setFormData({ ...formData, exchange_name: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="holding_date">Kaufdatum (für Haltefrist) *</Label>
            <Input
              id="holding_date"
              type="date"
              value={formData.tax_holding_period_start}
              onChange={(e) => setFormData({ ...formData, tax_holding_period_start: e.target.value })}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Wird hinzugefügt...' : 'Hinzufügen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}