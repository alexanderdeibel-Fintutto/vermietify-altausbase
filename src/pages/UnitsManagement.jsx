import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import UnitFilterBar from '@/components/units/UnitFilterBar';
import UnitTable from '@/components/units/UnitTable';
import QuickStats from '@/components/shared/QuickStats';

export default function UnitsManagementPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
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

  const filteredUnits = useMemo(() => {
    return units.filter(u => {
      const matchesSearch = (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
                           (u.unit_number || '').toLowerCase().includes(search.toLowerCase()) ||
                           (u.building_name || '').toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [units, search, statusFilter]);

  const occupiedCount = units.filter(u => u.status === 'occupied').length;
  const vacantCount = units.filter(u => u.status === 'vacant').length;
  const totalRent = units.reduce((sum, u) => sum + (u.rent || u.base_rent || 0), 0);

  const stats = [
    { label: 'Gesamt-Einheiten', value: units.length },
    { label: 'Vermietet', value: occupiedCount },
    { label: 'Verfügbar', value: vacantCount },
    { label: 'Monats-Ertrag', value: `€${totalRent.toFixed(0)}` },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extralight text-slate-700 tracking-wide">Wohneinheiten</h1>
        <p className="text-sm font-extralight text-slate-400 mt-1">Verwalten Sie alle Ihre Wohneinheiten</p>
      </div>
      <QuickStats stats={stats} accentColor="sky" />

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white p-4 rounded-lg border border-slate-200">
        <div className="flex-1 flex gap-2 w-full sm:w-auto">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Nach Nummer, Name oder Gebäude suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 font-light text-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              <SelectItem value="vacant">Verfügbar</SelectItem>
              <SelectItem value="occupied">Vermietet</SelectItem>
              <SelectItem value="renovation">Renovierung</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button 
          onClick={() => { setEditingUnit(null); setFormData({}); setShowDialog(true); }}
          className="bg-slate-900 hover:bg-slate-800 font-light gap-2 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Neue Einheit
        </Button>
      </div>

      {filteredUnits.length > 0 ? (
        <UnitTable units={filteredUnits} onEdit={(u) => { setEditingUnit(u); setFormData(u); setShowDialog(true); }} onDelete={(u) => deleteMutation.mutate(u.id)} />
      ) : (
        <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-sm font-light text-slate-600">Keine Einheiten gefunden</p>
        </div>
      )}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingUnit ? 'Einheit bearbeiten' : 'Neue Einheit'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input 
                placeholder="Einheitennummer" 
                value={formData.unit_number || ''} 
                onChange={(e) => setFormData({...formData, unit_number: e.target.value})} 
                className="font-light"
              />
              <Input 
                placeholder="Gebäude" 
                value={formData.building_name || ''} 
                onChange={(e) => setFormData({...formData, building_name: e.target.value})} 
                className="font-light"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input 
                placeholder="Fläche (m²)" 
                type="number" 
                step="0.01"
                value={formData.sqm || ''} 
                onChange={(e) => setFormData({...formData, sqm: parseFloat(e.target.value)})} 
                className="font-light"
              />
              <Input 
                placeholder="Zimmer" 
                type="number" 
                step="0.5"
                value={formData.rooms || ''} 
                onChange={(e) => setFormData({...formData, rooms: parseFloat(e.target.value)})} 
                className="font-light"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input 
                placeholder="Kaltmiete (€)" 
                type="number" 
                step="0.01"
                value={formData.base_rent || ''} 
                onChange={(e) => setFormData({...formData, base_rent: parseFloat(e.target.value)})} 
                className="font-light"
              />
              <Select value={formData.status || 'vacant'} onValueChange={(value) => setFormData({...formData, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vacant">Verfügbar</SelectItem>
                  <SelectItem value="occupied">Vermietet</SelectItem>
                  <SelectItem value="renovation">Renovierung</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setShowDialog(false)} className="font-light">Abbrechen</Button>
              <Button 
                onClick={() => editingUnit ? updateMutation.mutate(formData) : createMutation.mutate(formData)} 
                className="bg-slate-900 hover:bg-slate-800 font-light"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                Speichern
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}