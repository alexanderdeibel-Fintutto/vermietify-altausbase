import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import BankAccountFilterBar from '@/components/banking/BankAccountFilterBar';
import BankAccountTable from '@/components/banking/BankAccountTable';
import QuickStats from '@/components/shared/QuickStats';

export default function BankingManagementPage() {
  const [search, setSearch] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({});
  const queryClient = useQueryClient();

  const { data: accounts = [] } = useQuery({
    queryKey: ['bank-accounts'],
    queryFn: () => base44.entities.BankAccount?.list?.() || []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.BankAccount.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bank-accounts'] }); setShowDialog(false); setFormData({}); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.BankAccount.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bank-accounts'] })
  });

  const filteredAccounts = accounts.filter(a => (a.holder_name || '').toLowerCase().includes(search.toLowerCase()));
  const totalBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);

  const stats = [
    { label: 'Gesamt-Konten', value: accounts.length },
    { label: 'Gesamtsaldo', value: `€${totalBalance.toFixed(0)}` },
    { label: 'Aktive Konten', value: accounts.length },
    { label: 'Synchronisiert', value: '100%' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">🏦 Banking</h1>
        <p className="text-slate-600 mt-1">Verwalten Sie Ihre Bankkonten und Transaktionen</p>
      </div>
      <QuickStats stats={stats} accentColor="teal" />
      <BankAccountFilterBar onSearchChange={setSearch} onNewAccount={() => { setFormData({}); setShowDialog(true); }} />
      <BankAccountTable accounts={filteredAccounts} onDelete={(a) => deleteMutation.mutate(a.id)} />
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Konto hinzufügen</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Kontoinhaber" value={formData.holder_name || ''} onChange={(e) => setFormData({...formData, holder_name: e.target.value})} />
            <Input placeholder="IBAN" value={formData.iban || ''} onChange={(e) => setFormData({...formData, iban: e.target.value})} />
            <Input placeholder="Saldo" type="number" value={formData.balance || ''} onChange={(e) => setFormData({...formData, balance: parseFloat(e.target.value)})} />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowDialog(false)}>Abbrechen</Button>
              <Button onClick={() => createMutation.mutate(formData)} className="bg-teal-600 hover:bg-teal-700">Hinzufügen</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}