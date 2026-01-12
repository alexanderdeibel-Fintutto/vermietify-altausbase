import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function TransactionFormDialog({ open, onOpenChange, onSave, portfolioId }) {
  const [formData, setFormData] = useState({
    portfolio_account_id: '',
    asset_id: '',
    transaction_type: 'buy',
    transaction_date: new Date().toISOString().split('T')[0],
    quantity: '',
    price_per_unit: '',
    price_currency: 'EUR',
    fees: 0,
    taxes_withheld: 0
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['portfolio-accounts', portfolioId],
    queryFn: () => base44.entities.PortfolioAccount.filter({ portfolio_id: portfolioId }),
    enabled: !!portfolioId
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: () => base44.entities.Asset.list('-updated_date', 100)
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.portfolio_account_id || !formData.asset_id || !formData.quantity || !formData.price_per_unit) {
      toast.error('Konto, Asset, Menge und Preis erforderlich');
      return;
    }

    const quantity = parseFloat(formData.quantity);
    const price = parseFloat(formData.price_per_unit);
    const fees = parseFloat(formData.fees) || 0;
    const taxes = parseFloat(formData.taxes_withheld) || 0;

    const grossAmount = quantity * price;
    const netAmount = formData.transaction_type === 'buy'
      ? grossAmount + fees + taxes
      : grossAmount - fees - taxes;

    onSave({
      ...formData,
      quantity: formData.transaction_type === 'sell' ? -Math.abs(quantity) : quantity,
      gross_amount: grossAmount,
      net_amount: netAmount,
      exchange_rate: 1 // TODO: Währungsumrechnung
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Neue Transaktion</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Konto *
            </label>
            <select
              value={formData.portfolio_account_id}
              onChange={(e) => setFormData({ ...formData, portfolio_account_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value="">Bitte wählen...</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Asset *
            </label>
            <select
              value={formData.asset_id}
              onChange={(e) => setFormData({ ...formData, asset_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value="">Bitte wählen...</option>
              {assets.map(asset => (
                <option key={asset.id} value={asset.id}>
                  {asset.symbol} - {asset.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Transaktionstyp
              </label>
              <select
                value={formData.transaction_type}
                onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              >
                <option value="buy">Kauf</option>
                <option value="sell">Verkauf</option>
                <option value="dividend">Dividende</option>
                <option value="transfer_in">Einbuchung</option>
                <option value="transfer_out">Ausbuchung</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Datum *
              </label>
              <Input
                type="date"
                value={formData.transaction_date}
                onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Anzahl/Menge *
              </label>
              <Input
                type="number"
                step="any"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="z.B. 10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Preis pro Einheit *
              </label>
              <Input
                type="number"
                step="any"
                value={formData.price_per_unit}
                onChange={(e) => setFormData({ ...formData, price_per_unit: e.target.value })}
                placeholder="z.B. 150.50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Gebühren
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.fees}
                onChange={(e) => setFormData({ ...formData, fees: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Steuern
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.taxes_withheld}
                onChange={(e) => setFormData({ ...formData, taxes_withheld: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>

          {formData.quantity && formData.price_per_unit && (
            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="flex justify-between text-sm mb-2">
                <span>Bruttobetrag:</span>
                <span className="font-medium">
                  {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })
                    .format(parseFloat(formData.quantity) * parseFloat(formData.price_per_unit))}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold">
                <span>Nettobetrag:</span>
                <span>
                  {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })
                    .format(
                      parseFloat(formData.quantity) * parseFloat(formData.price_per_unit) +
                      (formData.transaction_type === 'buy' ? 1 : -1) *
                      (parseFloat(formData.fees || 0) + parseFloat(formData.taxes_withheld || 0))
                    )}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
              Speichern
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}