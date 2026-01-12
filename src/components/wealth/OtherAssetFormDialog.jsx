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

export default function OtherAssetFormDialog({ open, onOpenChange, onSubmit, isLoading, portfolio_id }) {
  const [formData, setFormData] = useState({
    portfolio_id: portfolio_id || '',
    asset_class: 'OTHER',
    name: '',
    quantity: '1',
    current_price: '',
    purchase_price_avg: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      quantity: parseFloat(formData.quantity) || 1,
      purchase_price_avg: parseFloat(formData.purchase_price_avg),
      current_price: parseFloat(formData.current_price),
      current_value: (parseFloat(formData.quantity) || 1) * parseFloat(formData.current_price),
      api_source: 'MANUAL',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Sonstiger Vermögenswert hinzufügen</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Bezeichnung *</Label>
            <Input
              id="name"
              placeholder="z.B. GmbH-Anteil, Kunstwerk"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="asset_class">Typ *</Label>
            <Select value={formData.asset_class} onValueChange={(value) => setFormData({ ...formData, asset_class: value })}>
              <SelectTrigger id="asset_class">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OTHER">Sonstiges</SelectItem>
                <SelectItem value="KUNSTWERK">Kunstwerk</SelectItem>
                <SelectItem value="SAMMLUNG">Sammlung</SelectItem>
                <SelectItem value="GMBH_ANTEIL">GmbH-Anteil</SelectItem>
                <SelectItem value="DARLEHEN_GEGEBEN">Darlehen</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="purchase_price">Wert/Kosten (EUR) *</Label>
            <Input
              id="purchase_price"
              type="number"
              step="0.01"
              placeholder="5000.00"
              value={formData.purchase_price_avg}
              onChange={(e) => setFormData({ ...formData, purchase_price_avg: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="current_price">Aktueller Schätzwert (EUR) *</Label>
            <Input
              id="current_price"
              type="number"
              step="0.01"
              placeholder="5500.00"
              value={formData.current_price}
              onChange={(e) => setFormData({ ...formData, current_price: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="quantity">Anzahl/Menge</Label>
            <Input
              id="quantity"
              type="number"
              step="0.01"
              placeholder="1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
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