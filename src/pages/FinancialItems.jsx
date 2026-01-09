import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FinancialItemFilterBar from '@/components/financial-items/FinancialItemFilterBar';
import FinancialItemTable from '@/components/financial-items/FinancialItemTable';
import QuickStats from '@/components/shared/QuickStats';

export default function FinancialItemsPage() {
  const [search, setSearch] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const queryClient = useQueryClient();

  const { data: items = [] } = useQuery({
    queryKey: ['financial-items'],
    queryFn: () => base44.entities.FinancialItem?.list?.() || []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.FinancialItem.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['financial-items'] }); setShowDialog(false); setFormData({}); }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.FinancialItem.update(editingItem.id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['financial-items'] }); setShowDialog(false); setEditingItem(null); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FinancialItem.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['financial-items'] })
  });

  const filteredItems = items.filter(i => (i.description || '').toLowerCase().includes(search.toLowerCase()));
  const income = items.filter(i => i.type === 'income').reduce((sum, i) => sum + (i.amount || 0), 0);
  const expenses = items.filter(i => i.type === 'expense').reduce((sum, i) => sum + (i.amount || 0), 0);
  const balance = income - expenses;

  const stats = [
    { label: 'Gesamteinnahmen', value: `€${income.toFixed(0)}` },
    { label: 'Gesamtausgaben', value: `€${expenses.toFixed(0)}` },
    { label: 'Bilanzsaldo', value: `€${balance.toFixed(0)}` },
    { label: 'Transaktionen', value: items.length },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extralight text-slate-700 tracking-wide">Finanzbuchungen</h1>
        <p className="text-sm font-extralight text-slate-400 mt-1">Verwalten Sie alle Finanzeinträge und Buchungen</p>
      </div>
      <QuickStats stats={stats} accentColor="fuchsia" />
      <FinancialItemFilterBar onSearchChange={setSearch} onNewItem={() => { setEditingItem(null); setFormData({}); setShowDialog(true); }} />
      <FinancialItemTable items={filteredItems} onEdit={(i) => { setEditingItem(i); setFormData(i); setShowDialog(true); }} onDelete={(i) => deleteMutation.mutate(i.id)} />
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingItem ? 'Buchung bearbeiten' : 'Neue Buchung'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Beschreibung" value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} />
            <Select value={formData.type || ''} onValueChange={(value) => setFormData({...formData, type: value})}>
              <SelectTrigger><SelectValue placeholder="Typ" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Einnahme</SelectItem>
                <SelectItem value="expense">Ausgabe</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Betrag" type="number" value={formData.amount || ''} onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value)})} />
            <Input placeholder="Datum" type="date" value={formData.date || ''} onChange={(e) => setFormData({...formData, date: e.target.value})} />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowDialog(false)}>Abbrechen</Button>
              <Button onClick={() => editingItem ? updateMutation.mutate(formData) : createMutation.mutate(formData)} className="bg-slate-700 hover:bg-slate-800 font-extralight">Speichern</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}