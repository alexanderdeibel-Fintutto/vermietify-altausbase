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
import { Checkbox } from '@/components/ui/checkbox';

export default function PreciousMetalFormDialog({ open, onOpenChange, onSubmit, isLoading, portfolio_id }) {
  const [formData, setFormData] = useState({
    portfolio_id: portfolio_id || '',
    asset_class: 'GOLD',
    name: '',
    quantity: '',
    purchase_price_avg: '',
    current_price: '',
    is_physical: true,
    storage_location: '',
    api_source: 'METALS_API',
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
          <DialogTitle>Neues Edelmetall hinzufügen</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="asset_class">Metall *</Label>
            <Select value={formData.asset_class} onValueChange={(value) => setFormData({ ...formData, asset_class: value })}>
              <SelectTrigger id="asset_class">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GOLD">Gold</SelectItem>
                <SelectItem value="SILVER">Silber</SelectItem>
                <SelectItem value="PLATINUM">Platin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="name">Beschreibung *</Label>
            <Input
              id="name"
              placeholder="z.B. Goldbarren 100g PAMP"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="quantity">Gewicht (g) *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                placeholder="100"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="current_price">Preis pro g (EUR) *</Label>
              <Input
                id="current_price"
                type="number"
                step="0.01"
                placeholder="65.00"
                value={formData.current_price}
                onChange={(e) => setFormData({ ...formData, current_price: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="purchase_price">Ø-Kaufpreis pro g (EUR) *</Label>
            <Input
              id="purchase_price"
              type="number"
              step="0.01"
              placeholder="60.00"
              value={formData.purchase_price_avg}
              onChange={(e) => setFormData({ ...formData, purchase_price_avg: e.target.value })}
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="is_physical"
              checked={formData.is_physical}
              onCheckedChange={(checked) => setFormData({ ...formData, is_physical: checked })}
            />
            <Label htmlFor="is_physical" className="font-normal">Physisch vorhanden (anstatt ETC-Zertifikat)</Label>
          </div>

          {formData.is_physical && (
            <div>
              <Label htmlFor="storage">Lagerort</Label>
              <Select value={formData.storage_location} onValueChange={(value) => setFormData({ ...formData, storage_location: value })}>
                <SelectTrigger id="storage">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ZUHAUSE">Zuhause</SelectItem>
                  <SelectItem value="BANKSCHLIESSFACH">Bankschließfach</SelectItem>
                  <SelectItem value="EDELMETALLHAENDLER">Edelmetallhändler</SelectItem>
                  <SelectItem value="ZOLLFREILAGER">Zollfreilager</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="purchase_date">Kaufdatum (für Haltefrist) *</Label>
            <Input
              id="purchase_date"
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