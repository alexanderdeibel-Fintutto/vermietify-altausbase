import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import OperatingCostsFilterBar from '@/components/operating-costs/OperatingCostsFilterBar';
import OperatingCostsTable from '@/components/operating-costs/OperatingCostsTable';
import QuickStats from '@/components/shared/QuickStats';

export default function OperatingCostsManagementPage() {
  const [search, setSearch] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingCost, setEditingCost] = useState(null);
  const [formData, setFormData] = useState({});
  const queryClient = useQueryClient();

  const { data: costs = [] } = useQuery({
    queryKey: ['operating-costs'],
    queryFn: () => base44.entities.OperatingCostStatementItem?.list?.() || []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.OperatingCostStatementItem.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['operating-costs'] }); setShowDialog(false); setFormData({}); }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.OperatingCostStatementItem.update(editingCost.id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['operating-costs'] }); setShowDialog(false); setEditingCost(null); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.OperatingCostStatementItem.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['operating-costs'] })
  });

  const filteredCosts = costs.filter(c => (c.category || '').toLowerCase().includes(search.toLowerCase()));
  const totalCosts = costs.reduce((sum, c) => sum + (c.amount || 0), 0);

  const stats = [
    { label: 'Gesamt-Posten', value: costs.length },
    { label: 'Gesamtbetrag', value: `€${totalCosts.toFixed(0)}` },
    { label: 'Durchschnitt', value: `€${costs.length > 0 ? (totalCosts / costs.length).toFixed(0) : 0}` },
    { label: 'Diesen Monat', value: 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">💸 Betriebskosten</h1>
        <p className="text-slate-600 mt-1">Verwalten Sie Ihre Betriebskosten und Abrechnung</p>
      </div>
      <QuickStats stats={stats} accentColor="amber" />
      <OperatingCostsFilterBar onSearchChange={setSearch} onNewCost={() => { setEditingCost(null); setFormData({}); setShowDialog(true); }} />
      <OperatingCostsTable costs={filteredCosts} onEdit={(c) => { setEditingCost(c); setFormData(c); setShowDialog(true); }} onDelete={(c) => deleteMutation.mutate(c.id)} />
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingCost ? 'Kosten bearbeiten' : 'Neue Kosten'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Kategorie" value={formData.category || ''} onChange={(e) => setFormData({...formData, category: e.target.value})} />
            <Input placeholder="Gebäude" value={formData.building_name || ''} onChange={(e) => setFormData({...formData, building_name: e.target.value})} />
            <Input placeholder="Betrag" type="number" value={formData.amount || ''} onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value)})} />
            <Input placeholder="Datum" type="date" value={formData.date || ''} onChange={(e) => setFormData({...formData, date: e.target.value})} />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowDialog(false)}>Abbrechen</Button>
              <Button onClick={() => editingCost ? updateMutation.mutate(formData) : createMutation.mutate(formData)} className="bg-amber-600 hover:bg-amber-700">Speichern</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}