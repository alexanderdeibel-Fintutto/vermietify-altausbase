import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function DividendFormDialog({ open, onOpenChange, onSave, portfolioId }) {
  const [formData, setFormData] = useState({
    portfolio_account_id: '',
    asset_id: '',
    ex_date: new Date().toISOString().split('T')[0],
    payment_date: new Date().toISOString().split('T')[0],
    dividend_type: 'regular',
    gross_amount_per_share: '',
    withholding_tax_rate: 0,
    currency: 'EUR'
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['portfolio-accounts', portfolioId],
    queryFn: () => base44.entities.PortfolioAccount.filter({ portfolio_id: portfolioId }),
    enabled: !!portfolioId
  });

  const { data: holdings = [] } = useQuery({
    queryKey: ['holdings'],
    queryFn: () => base44.entities.AssetHolding.list()
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: () => base44.entities.Asset.list()
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.portfolio_account_id || !formData.asset_id || !formData.gross_amount_per_share) {
      toast.error('Konto, Asset und Dividende pro Anteil erforderlich');
      return;
    }

    // Holdings für Anzahl laden
    const holding = holdings.find(h => 
      h.portfolio_account_id === formData.portfolio_account_id && 
      h.asset_id === formData.asset_id
    );

    if (!holding) {
      toast.error('Keine Position für dieses Asset gefunden');
      return;
    }

    const grossPerShare = parseFloat(formData.gross_amount_per_share);
    const grossTotal = holding.quantity * grossPerShare;
    const withholdingTax = grossTotal * (parseFloat(formData.withholding_tax_rate) / 100);
    const netAmount = grossTotal - withholdingTax;

    onSave({
      asset_holding_id: holding.id,
      asset_id: formData.asset_id,
      portfolio_account_id: formData.portfolio_account_id,
      ex_date: formData.ex_date,
      payment_date: formData.payment_date,
      record_date: formData.ex_date,
      dividend_type: formData.dividend_type,
      gross_amount_per_share: grossPerShare,
      gross_amount_total: grossTotal,
      withholding_tax: withholdingTax,
      withholding_tax_rate: parseFloat(formData.withholding_tax_rate),
      net_amount: netAmount,
      currency: formData.currency,
      exchange_rate: 1,
      net_amount_eur: netAmount,
      is_reinvested: false
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dividende erfassen</DialogTitle>
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
                Ex-Datum *
              </label>
              <Input
                type="date"
                value={formData.ex_date}
                onChange={(e) => setFormData({ ...formData, ex_date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Zahlungsdatum *
              </label>
              <Input
                type="date"
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Dividende pro Anteil *
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.gross_amount_per_share}
                onChange={(e) => setFormData({ ...formData, gross_amount_per_share: e.target.value })}
                placeholder="z.B. 0.50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Quellensteuer (%)
              </label>
              <Input
                type="number"
                step="0.1"
                value={formData.withholding_tax_rate}
                onChange={(e) => setFormData({ ...formData, withholding_tax_rate: e.target.value })}
                placeholder="z.B. 15"
              />
            </div>
          </div>

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