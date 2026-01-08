import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import UnitFilterBar from '@/components/units/UnitFilterBar';
import UnitTable from '@/components/units/UnitTable';
import QuickStats from '@/components/shared/QuickStats';

export default function UnitsManagementPage() {
  const [search, setSearch] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [formData, setFormData] = useState({});
  const queryClient = useQueryClient();

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: () => base44.entities.Unit?.list?.() || []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Unit.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['units'] }); setShowDialog(false); setFormData({}); }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Unit.update(editingUnit.id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['units'] }); setShowDialog(false); setEditingUnit(null); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Unit.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['units'] })
  });

  const filteredUnits = units.filter(u => (u.name || '').toLowerCase().includes(search.toLowerCase()));
  const occupiedCount = units.filter(u => u.status === 'occupied').length;
  const totalRent = units.reduce((sum, u) => sum + (u.rent || 0), 0);

  const stats = [
    { label: 'Gesamt-Einheiten', value: units.length },
    { label: 'Vermietet', value: occupiedCount },
    { label: 'Leer', value: units.length - occupiedCount },
    { label: 'Gesamtmiete', value: `€${totalRent.toFixed(0)}` },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">🏠 Wohneinheiten</h1>
        <p className="text-slate-600 mt-1">Verwalten Sie alle Ihre Wohneinheiten</p>
      </div>
      <QuickStats stats={stats} accentColor="sky" />
      <UnitFilterBar onSearchChange={setSearch} onNewUnit={() => { setEditingUnit(null); setFormData({}); setShowDialog(true); }} />
      <UnitTable units={filteredUnits} onEdit={(u) => { setEditingUnit(u); setFormData(u); setShowDialog(true); }} onDelete={(u) => deleteMutation.mutate(u.id)} />
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingUnit ? 'Einheit bearbeiten' : 'Neue Einheit'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Name/Nummer" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            <Input placeholder="Gebäude" value={formData.building_name || ''} onChange={(e) => setFormData({...formData, building_name: e.target.value})} />
            <Input placeholder="Fläche (m²)" type="number" value={formData.area || ''} onChange={(e) => setFormData({...formData, area: parseFloat(e.target.value)})} />
            <Input placeholder="Miete" type="number" value={formData.rent || ''} onChange={(e) => setFormData({...formData, rent: parseFloat(e.target.value)})} />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowDialog(false)}>Abbrechen</Button>
              <Button onClick={() => editingUnit ? updateMutation.mutate(formData) : createMutation.mutate(formData)} className="bg-sky-600 hover:bg-sky-700">Speichern</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}