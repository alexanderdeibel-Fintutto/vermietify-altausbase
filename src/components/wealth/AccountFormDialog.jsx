import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function AccountFormDialog({ open, onOpenChange, onSave, portfolioId, editingAccount = null }) {
  const [formData, setFormData] = useState(editingAccount || {
    portfolio_id: portfolioId,
    name: '',
    account_type: 'broker',
    institution_name: '',
    account_number: '',
    currency: 'EUR',
    is_active: true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.institution_name) {
      toast.error('Name und Institution erforderlich');
      return;
    }
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingAccount ? 'Konto bearbeiten' : 'Neues Konto'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Kontoname *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="z.B. Trade Republic Depot"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Institution *
            </label>
            <Input
              value={formData.institution_name}
              onChange={(e) => setFormData({ ...formData, institution_name: e.target.value })}
              placeholder="z.B. Trade Republic"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Kontotyp
              </label>
              <select
                value={formData.account_type}
                onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              >
                <option value="broker">Broker/Depot</option>
                <option value="crypto_exchange">Krypto-Börse</option>
                <option value="bank">Bank</option>
                <option value="p2p_platform">P2P-Plattform</option>
                <option value="insurance">Versicherung</option>
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
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Depotnummer/Kontonummer
            </label>
            <Input
              value={formData.account_number || ''}
              onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
              placeholder="Optional"
            />
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