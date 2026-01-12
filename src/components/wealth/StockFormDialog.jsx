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

export default function StockFormDialog({ open, onOpenChange, onSubmit, isLoading, portfolio_id }) {
  const [formData, setFormData] = useState({
    portfolio_id: portfolio_id || '',
    asset_class: 'STOCK',
    name: '',
    isin: '',
    wkn: '',
    symbol: '',
    quantity: '',
    purchase_price_avg: '',
    current_price: '',
    api_source: 'MANUAL',
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
          <DialogTitle>Neues Wertpapier hinzufügen</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="asset_class">Asset-Klasse *</Label>
            <Select value={formData.asset_class} onValueChange={(value) => setFormData({ ...formData, asset_class: value })}>
              <SelectTrigger id="asset_class">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STOCK">Aktie</SelectItem>
                <SelectItem value="ETF">ETF</SelectItem>
                <SelectItem value="MUTUAL_FUND">Fonds</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="name">Bezeichnung *</Label>
            <Input
              id="name"
              placeholder="z.B. Apple Inc."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="isin">ISIN</Label>
              <Input
                id="isin"
                placeholder="DE0005933931"
                value={formData.isin}
                onChange={(e) => setFormData({ ...formData, isin: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="wkn">WKN</Label>
              <Input
                id="wkn"
                placeholder="593393"
                value={formData.wkn}
                onChange={(e) => setFormData({ ...formData, wkn: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="symbol">Symbol/Ticker *</Label>
            <Input
              id="symbol"
              placeholder="AAPL"
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
                step="0.001"
                placeholder="10"
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
                placeholder="150.00"
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
              placeholder="160.00"
              value={formData.current_price}
              onChange={(e) => setFormData({ ...formData, current_price: e.target.value })}
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