import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function AssetFormDialog({ open, onOpenChange, onSave, editingAsset = null }) {
  const [formData, setFormData] = useState(editingAsset || {
    symbol: '',
    isin: '',
    name: '',
    asset_class: 'stock',
    currency: 'EUR',
    exchange: '',
    country: '',
    tax_category: 'standard',
    is_actively_traded: true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.symbol || !formData.name) {
      toast.error('Symbol und Name erforderlich');
      return;
    }
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingAsset ? 'Asset bearbeiten' : 'Neues Asset'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Symbol/Ticker *
              </label>
              <Input
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                placeholder="z.B. AAPL"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                ISIN
              </label>
              <Input
                value={formData.isin || ''}
                onChange={(e) => setFormData({ ...formData, isin: e.target.value.toUpperCase() })}
                placeholder="z.B. US0378331005"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Name *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="z.B. Apple Inc."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Asset-Klasse
              </label>
              <select
                value={formData.asset_class}
                onChange={(e) => setFormData({ ...formData, asset_class: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              >
                <option value="stock">Aktie</option>
                <option value="etf">ETF</option>
                <option value="bond">Anleihe</option>
                <option value="crypto">Kryptowährung</option>
                <option value="commodity">Rohstoff</option>
                <option value="precious_metal">Edelmetall</option>
                <option value="p2p_loan">P2P-Kredit</option>
                <option value="real_estate_fund">Immobilienfonds</option>
                <option value="other">Sonstiges</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Währung
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              >
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="CHF">CHF</option>
                <option value="GBP">GBP</option>
                <option value="BTC">BTC</option>
                <option value="ETH">ETH</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Börse/Exchange
              </label>
              <Input
                value={formData.exchange || ''}
                onChange={(e) => setFormData({ ...formData, exchange: e.target.value })}
                placeholder="z.B. XETRA, NYSE"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Land
              </label>
              <Input
                value={formData.country || ''}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="z.B. Deutschland, USA"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Steuerliche Kategorie
            </label>
            <select
              value={formData.tax_category}
              onChange={(e) => setFormData({ ...formData, tax_category: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value="standard">Standard</option>
              <option value="equity_fund_30">Aktienfonds (30% pauschal)</option>
              <option value="mixed_fund_15">Mischfonds (15% pauschal)</option>
              <option value="bond_fund_0">Rentenfonds (0% pauschal)</option>
              <option value="real_estate_fund_60">Immobilienfonds (60% pauschal)</option>
              <option value="crypto_private">Krypto (Privatvermögen)</option>
              <option value="precious_metal_private">Edelmetall (Privatvermögen)</option>
            </select>
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