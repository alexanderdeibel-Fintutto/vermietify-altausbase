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

export default function AssetTransactionDialog({ open, onOpenChange, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    asset_id: '',
    transaction_type: 'KAUF',
    transaction_date: new Date().toISOString().split('T')[0],
    quantity: '',
    price_per_unit: '',
    fees: '',
    notes: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const quantity = parseFloat(formData.quantity);
    const pricePerUnit = parseFloat(formData.price_per_unit);
    const fees = formData.fees ? parseFloat(formData.fees) : 0;
    const totalAmount = (quantity * pricePerUnit) + fees;

    onSubmit({
      ...formData,
      quantity,
      price_per_unit: pricePerUnit,
      fees,
      total_amount: totalAmount,
      tax_relevant: formData.transaction_type === 'VERKAUF',
      tax_year: new Date().getFullYear(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Transaktion hinzufügen</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="transaction_type">Art *</Label>
              <Select value={formData.transaction_type} onValueChange={(v) => setFormData({ ...formData, transaction_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KAUF">Kauf</SelectItem>
                  <SelectItem value="VERKAUF">Verkauf</SelectItem>
                  <SelectItem value="TRANSFER_IN">Transfer herein</SelectItem>
                  <SelectItem value="TRANSFER_OUT">Transfer hinaus</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="transaction_date">Datum *</Label>
              <Input
                id="transaction_date"
                type="date"
                value={formData.transaction_date}
                onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="quantity">Menge *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.0001"
                placeholder="z.B. 10"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="price">Preis pro Einheit (EUR) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="z.B. 100.50"
                value={formData.price_per_unit}
                onChange={(e) => setFormData({ ...formData, price_per_unit: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="fees">Gebühren (EUR)</Label>
              <Input
                id="fees"
                type="number"
                step="0.01"
                placeholder="z.B. 5.00"
                value={formData.fees}
                onChange={(e) => setFormData({ ...formData, fees: e.target.value })}
              />
            </div>
          </div>

          {formData.quantity && formData.price_per_unit && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                Gesamtbetrag: <span className="font-bold">
                  {((parseFloat(formData.quantity) * parseFloat(formData.price_per_unit)) + (formData.fees ? parseFloat(formData.fees) : 0)).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                </span>
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="notes">Notizen</Label>
            <Input
              id="notes"
              placeholder="z.B. Limit-Kauf bei XETRA"
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