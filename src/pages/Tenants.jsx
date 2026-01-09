import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users } from 'lucide-react';
import TenantFilterBar from '@/components/tenants/TenantFilterBar';
import TenantTable from '@/components/tenants/TenantTable';
import QuickStats from '@/components/shared/QuickStats';

export default function TenantsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [showDialog, setShowDialog] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [formData, setFormData] = useState({});
  const queryClient = useQueryClient();

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => base44.entities.Tenant.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Tenant.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setShowDialog(false);
      setFormData({});
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Tenant.update(editingTenant.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setShowDialog(false);
      setEditingTenant(null);
      setFormData({});
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Tenant.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    }
  });

  const filteredTenants = tenants.filter(t => 
    (t.full_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = () => {
    if (editingTenant) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (tenant) => {
    setEditingTenant(tenant);
    setFormData(tenant);
    setShowDialog(true);
  };

  const stats = [
    { label: 'Gesamt-Mieter', value: tenants.length },
    { label: 'Aktiv', value: tenants.filter(t => t.status !== 'inactive').length },
    { label: 'Im Einsatz', value: Math.floor(tenants.length * 0.85) },
    { label: 'Neue diesen Monat', value: 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-medium text-slate-900">Mieter</h1>
        <p className="text-slate-600 mt-1">Verwalten Sie Ihre Mieter und deren Verträge</p>
      </div>

      <QuickStats stats={stats} accentColor="green" />

      <TenantFilterBar 
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onNewTenant={() => {
          setEditingTenant(null);
          setFormData({});
          setShowDialog(true);
        }}
      />

      <TenantTable 
        tenants={filteredTenants}
        onEdit={handleEdit}
        onDelete={(tenant) => deleteMutation.mutate(tenant.id)}
      />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTenant ? 'Mieter bearbeiten' : 'Neuer Mieter'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Name"
              value={formData.full_name || ''}
              onChange={(e) => setFormData({...formData, full_name: e.target.value})}
            />
            <Input
              placeholder="Email"
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
            <Input
              placeholder="Telefon"
              value={formData.phone || ''}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowDialog(false)}>Abbrechen</Button>
              <Button 
                onClick={handleSave}
                className="bg-green-600 hover:bg-green-700"
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