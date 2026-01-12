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
import { Checkbox } from '@/components/ui/checkbox';

export default function DividendFormDialog({ open, onOpenChange, asset }) {
  const [formData, setFormData] = useState({
    dividend_type: 'DIVIDEND',
    payment_date: new Date().toISOString().split('T')[0],
    amount_gross: '',
    tax_withheld: '',
    reinvested: false,
  });
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Dividend.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dividends'] });
      onOpenChange(false);
      setFormData({
        dividend_type: 'DIVIDEND',
        payment_date: new Date().toISOString().split('T')[0],
        amount_gross: '',
        tax_withheld: '',
        reinvested: false,
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const gross = parseFloat(formData.amount_gross);
    const withheld = parseFloat(formData.tax_withheld || 0);
    
    createMutation.mutate({
      asset_id: asset.id,
      dividend_type: formData.dividend_type,
      payment_date: formData.payment_date,
      amount_gross: gross,
      amount_net: gross - withheld,
      tax_withheld: withheld,
      tax_year: new Date(formData.payment_date).getFullYear(),
      reinvested: formData.reinvested,
    });
  };

  if (!asset) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Dividende hinzufügen: {asset.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="div_type">Ausschüttungstyp *</Label>
            <Select value={formData.dividend_type} onValueChange={(value) => setFormData({ ...formData, dividend_type: value })}>
              <SelectTrigger id="div_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DIVIDEND">Dividende</SelectItem>
                <SelectItem value="ETF_DISTRIBUTION">ETF-Ausschüttung</SelectItem>
                <SelectItem value="INTEREST">Zinsen</SelectItem>
                <SelectItem value="STAKING_REWARD">Staking-Ertrag</SelectItem>
                <SelectItem value="MINING_REWARD">Mining-Ertrag</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="payment_date">Zahlungsdatum *</Label>
            <Input
              id="payment_date"
              type="date"
              value={formData.payment_date}
              onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="amount_gross">Bruttobetrag (EUR) *</Label>
            <Input
              id="amount_gross"
              type="number"
              step="0.01"
              placeholder="100.00"
              value={formData.amount_gross}
              onChange={(e) => setFormData({ ...formData, amount_gross: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="tax_withheld">Einbehaltene Steuer (EUR)</Label>
            <Input
              id="tax_withheld"
              type="number"
              step="0.01"
              placeholder="26.37"
              value={formData.tax_withheld}
              onChange={(e) => setFormData({ ...formData, tax_withheld: e.target.value })}
            />
            <p className="text-xs text-slate-500 mt-1">KapErtSt 25% + Soli 5.5% + ggf. Kirche</p>
          </div>

          <div className="bg-blue-50 p-3 rounded border border-blue-200">
            <p className="text-xs text-blue-800">
              <strong>Nettobetrag:</strong> {(parseFloat(formData.amount_gross || 0) - parseFloat(formData.tax_withheld || 0)).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="reinvested"
              checked={formData.reinvested}
              onCheckedChange={(checked) => setFormData({ ...formData, reinvested: checked })}
            />
            <Label htmlFor="reinvested" className="font-normal">Dividende reinvestiert</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Wird gespeichert...' : 'Hinzufügen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}