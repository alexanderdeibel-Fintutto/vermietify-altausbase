import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import CostTypeFilterBar from '@/components/cost-types/CostTypeFilterBar';
import CostTypeTable from '@/components/cost-types/CostTypeTable';
import QuickStats from '@/components/shared/QuickStats';

export default function CostTypesPage() {
  const [search, setSearch] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [formData, setFormData] = useState({});
  const queryClient = useQueryClient();

  const { data: costTypes = [] } = useQuery({
    queryKey: ['cost-types'],
    queryFn: () => base44.entities.CostType?.list?.() || []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CostType.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cost-types'] }); setShowDialog(false); setFormData({}); }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.CostType.update(editingType.id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cost-types'] }); setShowDialog(false); setEditingType(null); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CostType.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cost-types'] })
  });

  const filteredTypes = costTypes.filter(t => (t.name || '').toLowerCase().includes(search.toLowerCase()));
  const allocatableCount = costTypes.filter(t => t.allocatable).length;

  const stats = [
    { label: 'Gesamt-Kostenarten', value: costTypes.length },
    { label: 'Umlagesfähig', value: allocatableCount },
    { label: 'Nicht umlagesfähig', value: costTypes.length - allocatableCount },
    { label: 'Diese Woche verwendet', value: 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">💰 Kostenarten</h1>
        <p className="text-slate-600 mt-1">Definieren Sie Kostenarten für Ihre Gebäude</p>
      </div>
      <QuickStats stats={stats} accentColor="indigo" />
      <CostTypeFilterBar onSearchChange={setSearch} onNewCostType={() => { setEditingType(null); setFormData({}); setShowDialog(true); }} />
      <CostTypeTable costTypes={filteredTypes} onEdit={(t) => { setEditingType(t); setFormData(t); setShowDialog(true); }} onDelete={(t) => deleteMutation.mutate(t.id)} />
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingType ? 'Kostenart bearbeiten' : 'Neue Kostenart'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Name" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            <Select value={formData.category || ''} onValueChange={(value) => setFormData({...formData, category: value})}>
              <SelectTrigger><SelectValue placeholder="Kategorie" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="maintenance">Instandhaltung</SelectItem>
                <SelectItem value="utilities">Nebenkosten</SelectItem>
                <SelectItem value="insurance">Versicherung</SelectItem>
              </SelectContent>
            </Select>
            <Select value={formData.tax_treatment || ''} onValueChange={(value) => setFormData({...formData, tax_treatment: value})}>
              <SelectTrigger><SelectValue placeholder="Steuerliche Behandlung" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Sofort</SelectItem>
                <SelectItem value="depreciation">Abschreibung</SelectItem>
                <SelectItem value="distributed">Verteilt</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Checkbox id="allocatable" checked={formData.allocatable || false} onCheckedChange={(checked) => setFormData({...formData, allocatable: checked})} />
              <label htmlFor="allocatable" className="text-sm text-slate-700">Umlagesfähig nach BetrKV</label>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowDialog(false)}>Abbrechen</Button>
              <Button onClick={() => editingType ? updateMutation.mutate(formData) : createMutation.mutate(formData)} className="bg-indigo-600 hover:bg-indigo-700">Speichern</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}