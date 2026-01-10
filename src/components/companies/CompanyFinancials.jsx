import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, CreditCard } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function CompanyFinancials({ companyId, bankAccounts = [], onUpdate }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    bank_name: '',
    account_holder: '',
    iban: '',
    bic: ''
  });

  const handleAddAccount = () => {
    if (!formData.bank_name || !formData.iban) return;
    const newAccount = {
      id: Math.random().toString(36),
      ...formData
    };
    onUpdate([...bankAccounts, newAccount]);
    setFormData({ bank_name: '', account_holder: '', iban: '', bic: '' });
    setDialogOpen(false);
  };

  const maskIBAN = (iban) => {
    if (!iban) return '';
    return iban.slice(0, 2) + ' ' + iban.slice(2, -4).replace(/./g, '*') + ' ' + iban.slice(-4);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <CreditCard className="w-5 h-5" />
          Bankkonten & Finanzen
        </CardTitle>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Konto hinzufügen
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {bankAccounts.map(account => (
            <div key={account.id} className="p-3 bg-slate-50 rounded-lg border">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1">
                  <h4 className="font-medium text-sm text-slate-900">{account.bank_name}</h4>
                  <p className="text-xs text-slate-600 mt-1">{account.account_holder}</p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                  onClick={() => onUpdate(bankAccounts.filter(a => a.id !== account.id))}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-mono text-slate-700">{maskIBAN(account.iban)}</p>
                {account.bic && (
                  <p className="text-xs text-slate-600">BIC: {account.bic}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {bankAccounts.length === 0 && (
          <p className="text-center text-slate-500 text-sm py-6">Keine Bankkonten vorhanden</p>
        )}

        {/* Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bankkonto hinzufügen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Bankname"
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
              />
              <Input
                placeholder="Kontoinhaber"
                value={formData.account_holder}
                onChange={(e) => setFormData({ ...formData, account_holder: e.target.value })}
              />
              <Input
                placeholder="IBAN"
                value={formData.iban}
                onChange={(e) => setFormData({ ...formData, iban: e.target.value.toUpperCase() })}
              />
              <Input
                placeholder="BIC (optional)"
                value={formData.bic}
                onChange={(e) => setFormData({ ...formData, bic: e.target.value.toUpperCase() })}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Abbrechen</Button>
                <Button onClick={handleAddAccount} disabled={!formData.bank_name || !formData.iban}>
                  Hinzufügen
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}