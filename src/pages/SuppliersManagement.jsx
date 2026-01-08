import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import SupplierFilterBar from '@/components/suppliers/SupplierFilterBar';
import SupplierTable from '@/components/suppliers/SupplierTable';
import QuickStats from '@/components/shared/QuickStats';

export default function SuppliersManagementPage() {
  const [search, setSearch] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({});
  const queryClient = useQueryClient();

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => base44.entities.Supplier?.list?.() || []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Supplier.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['suppliers'] }); setShowDialog(false); setFormData({}); }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Supplier.update(editingSupplier.id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['suppliers'] }); setShowDialog(false); setEditingSupplier(null); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Supplier.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suppliers'] })
  });

  const filteredSuppliers = suppliers.filter(s => (s.name || '').toLowerCase().includes(search.toLowerCase()));

  const stats = [
    { label: 'Gesamt-Lieferanten', value: suppliers.length },
    { label: 'Aktiv', value: suppliers.filter(s => s.is_active !== false).length },
    { label: 'Diese Woche kontaktiert', value: 0 },
    { label: 'Durchschn. Bewertung', value: '4.2 ⭐' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">🔧 Lieferanten</h1>
        <p className="text-slate-600 mt-1">Verwalten Sie Ihre Lieferanten und Handwerker</p>
      </div>
      <QuickStats stats={stats} accentColor="lime" />
      <SupplierFilterBar onSearchChange={setSearch} onNewSupplier={() => { setEditingSupplier(null); setFormData({}); setShowDialog(true); }} />
      <SupplierTable suppliers={filteredSuppliers} onEdit={(s) => { setEditingSupplier(s); setFormData(s); setShowDialog(true); }} onDelete={(s) => deleteMutation.mutate(s.id)} />
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingSupplier ? 'Lieferant bearbeiten' : 'Neuer Lieferant'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Name" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            <Input placeholder="Kategorie" value={formData.category || ''} onChange={(e) => setFormData({...formData, category: e.target.value})} />
            <Input placeholder="Telefon" value={formData.phone || ''} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
            <Input placeholder="Email" type="email" value={formData.email || ''} onChange={(e) => setFormData({...formData, email: e.target.value})} />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowDialog(false)}>Abbrechen</Button>
              <Button onClick={() => editingSupplier ? updateMutation.mutate(formData) : createMutation.mutate(formData)} className="bg-lime-600 hover:bg-lime-700">Speichern</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}