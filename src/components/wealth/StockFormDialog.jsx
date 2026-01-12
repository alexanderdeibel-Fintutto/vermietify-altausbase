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

export default function StockFormDialog({ open, onOpenChange, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    isin: '',
    wkn: '',
    name: '',
    ticker: '',
    type: 'ETF',
    exchange: 'XETRA',
    currency: 'EUR',
    country: 'DE',
    sector: 'TECHNOLOGIE',
    teilfreistellung_prozent: 30,
    is_accumulating: false,
    ter: '',
    current_price: '',
    notes: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      current_price: formData.current_price ? parseFloat(formData.current_price) : null,
      ter: formData.ter ? parseFloat(formData.ter) : null,
      teilfreistellung_prozent: parseInt(formData.teilfreistellung_prozent),
      current_price_date: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Aktie/ETF hinzufügen</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="isin">ISIN *</Label>
              <Input
                id="isin"
                placeholder="z.B. DE0007164600"
                value={formData.isin}
                onChange={(e) => setFormData({ ...formData, isin: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="wkn">WKN</Label>
              <Input
                id="wkn"
                placeholder="z.B. 716460"
                value={formData.wkn}
                onChange={(e) => setFormData({ ...formData, wkn: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="z.B. SAP SE"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ticker">Ticker</Label>
              <Input
                id="ticker"
                placeholder="z.B. SAP"
                value={formData.ticker}
                onChange={(e) => setFormData({ ...formData, ticker: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="type">Typ *</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AKTIE">Aktie</SelectItem>
                  <SelectItem value="ETF">ETF</SelectItem>
                  <SelectItem value="FONDS">Fonds</SelectItem>
                  <SelectItem value="ANLEIHE">Anleihe</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="exchange">Börse</Label>
              <Select value={formData.exchange} onValueChange={(v) => setFormData({ ...formData, exchange: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="XETRA">Xetra</SelectItem>
                  <SelectItem value="NYSE">NYSE</SelectItem>
                  <SelectItem value="NASDAQ">Nasdaq</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="currency">Währung</Label>
              <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="country">Domizil</Label>
              <Input
                id="country"
                placeholder="z.B. DE"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value.toUpperCase() })}
                maxLength="2"
              />
            </div>
            <div>
              <Label htmlFor="sector">Branche</Label>
              <Select value={formData.sector} onValueChange={(v) => setFormData({ ...formData, sector: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TECHNOLOGIE">Technologie</SelectItem>
                  <SelectItem value="FINANZEN">Finanzen</SelectItem>
                  <SelectItem value="INDUSTRIE">Industrie</SelectItem>
                  <SelectItem value="KONSUMGÜTER">Konsumgüter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ter">TER (%)</Label>
              <Input
                id="ter"
                type="number"
                step="0.01"
                placeholder="z.B. 0.03"
                value={formData.ter}
                onChange={(e) => setFormData({ ...formData, ter: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="price">Aktueller Kurs (EUR)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="z.B. 125.50"
                value={formData.current_price}
                onChange={(e) => setFormData({ ...formData, current_price: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notizen</Label>
            <Input
              id="notes"
              placeholder="z.B. Sparplan aktiv"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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