import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function AssetTransactionDialog({ open, onOpenChange, asset }) {
  const [formData, setFormData] = useState({
    transaction_type: 'BUY',
    transaction_date: new Date().toISOString().split('T')[0],
    quantity: '',
    price_per_unit: '',
    fees: '0',
    notes: '',
  });
  const [calculatedGain, setCalculatedGain] = useState(null);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AssetTransaction.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['assets_stocks'] });
      onOpenChange(false);
      setFormData({
        transaction_type: 'BUY',
        transaction_date: new Date().toISOString().split('T')[0],
        quantity: '',
        price_per_unit: '',
        fees: '0',
        notes: '',
      });
    },
  });

  const handleCalculateGain = () => {
    if (formData.transaction_type === 'SELL' && formData.quantity && formData.price_per_unit) {
      const revenue = parseFloat(formData.quantity) * parseFloat(formData.price_per_unit);
      const costBasis = parseFloat(formData.quantity) * (asset?.purchase_price_avg || 0);
      const gain = revenue - costBasis - parseFloat(formData.fees || 0);
      setCalculatedGain(gain);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({
      asset_id: asset.id,
      transaction_type: formData.transaction_type,
      transaction_date: formData.transaction_date,
      quantity: formData.transaction_type === 'SELL' ? -parseFloat(formData.quantity) : parseFloat(formData.quantity),
      price_per_unit: parseFloat(formData.price_per_unit),
      total_amount: 
        (formData.transaction_type === 'SELL' ? -1 : 1) * 
        (parseFloat(formData.quantity) * parseFloat(formData.price_per_unit) + parseFloat(formData.fees || 0)),
      fees: parseFloat(formData.fees || 0),
      tax_relevant: formData.transaction_type === 'SELL',
      realized_gain_loss: formData.transaction_type === 'SELL' ? calculatedGain : null,
      notes: formData.notes,
    });
  };

  if (!asset) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Transaktion: {asset.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="tx_type">Transaktionstyp *</Label>
            <Select 
              value={formData.transaction_type} 
              onValueChange={(value) => {
                setFormData({ ...formData, transaction_type: value });
                setCalculatedGain(null);
              }}
            >
              <SelectTrigger id="tx_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BUY">Kauf</SelectItem>
                <SelectItem value="SELL">Verkauf</SelectItem>
                <SelectItem value="TRANSFER_IN">Transfer rein</SelectItem>
                <SelectItem value="TRANSFER_OUT">Transfer raus</SelectItem>
                <SelectItem value="DIVIDEND">Dividende</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="tx_date">Datum *</Label>
            <Input
              id="tx_date"
              type="date"
              value={formData.transaction_date}
              onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
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
              <Label htmlFor="price">Preis pro Einheit (EUR) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="150.00"
                value={formData.price_per_unit}
                onChange={(e) => setFormData({ ...formData, price_per_unit: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="fees">Gebühren (EUR)</Label>
            <Input
              id="fees"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.fees}
              onChange={(e) => setFormData({ ...formData, fees: e.target.value })}
            />
          </div>

          {/* Gain/Loss für Verkäufe */}
          {formData.transaction_type === 'SELL' && (
            <>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCalculateGain}
                className="w-full"
              >
                Gewinn/Verlust berechnen
              </Button>

              {calculatedGain !== null && (
                <Alert className={calculatedGain >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription className={calculatedGain >= 0 ? 'text-green-800' : 'text-red-800'}>
                    Gewinn/Verlust: {calculatedGain >= 0 ? '+' : ''}{calculatedGain.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}

          <div>
            <Label htmlFor="notes">Notizen</Label>
            <Input
              id="notes"
              placeholder="z.B. Broker-Referenz"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Wird gespeichert...' : 'Speichern'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}