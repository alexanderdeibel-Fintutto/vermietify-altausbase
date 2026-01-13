import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, Search } from 'lucide-react';
import { FeatureGateInline } from '@/components/subscription/FeatureGateInline';
import TenantFilterBar from '@/components/tenants/TenantFilterBar';
import TenantTable from '@/components/tenants/TenantTable';
import TenantBulkActionsBar from '@/components/tenants/TenantBulkActionsBar';
import QuickStats from '@/components/shared/QuickStats';
import QuickTenantDialog from '@/components/tenants/QuickTenantDialog';

export default function TenantsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [portalAccess, setPortalAccess] = useState('all');
  const [sortBy, setSortBy] = useState('name_asc');
  const [showDialog, setShowDialog] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [formData, setFormData] = useState({});
  const [selectedIds, setSelectedIds] = useState(new Set());
  const queryClient = useQueryClient();

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => base44.entities.Tenant.list()
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const tenant = await base44.entities.Tenant.create(data);
      
      // Trigger onboarding workflow
      try {
        await base44.functions.invoke('initiateTenantOnboarding', {
          tenant_id: tenant.id,
          tenant_email: data.email,
          tenant_name: data.full_name,
          unit_id: data.unit_id,
          building_id: data.building_id,
          rent_amount: data.rent_amount,
          start_date: data.start_date
        });
      } catch (error) {
        console.warn('Onboarding workflow failed:', error);
      }

      return tenant;
    },
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

  const filteredTenants = useMemo(() => {
    let filtered = tenants.filter(t => {
      const fullName = `${t.first_name || ''} ${t.last_name || ''}`.toLowerCase();
      const nameMatch = fullName.includes(search.toLowerCase());
      const emailMatch = (t.email || '').toLowerCase().includes(search.toLowerCase());
      const phoneMatch = (t.phone || '').toLowerCase().includes(search.toLowerCase()) ||
                         (t.telefon_mobil || '').toLowerCase().includes(search.toLowerCase());
      const statusMatch = status === 'all' || (t.aktiv ? 'active' : 'inactive') === status;
      const portalMatch = portalAccess === 'all' || 
        (portalAccess === 'with_access' ? t.portal_enabled : !t.portal_enabled);
      return (nameMatch || emailMatch || phoneMatch) && statusMatch && portalMatch;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':
          const nameA = `${a.last_name || ''} ${a.first_name || ''}`;
          const nameB = `${b.last_name || ''} ${b.first_name || ''}`;
          return nameA.localeCompare(nameB);
        case 'name_desc':
          const nameA2 = `${a.last_name || ''} ${a.first_name || ''}`;
          const nameB2 = `${b.last_name || ''} ${b.first_name || ''}`;
          return nameB2.localeCompare(nameA2);
        case 'created_recent':
          return new Date(b.created_date) - new Date(a.created_date);
        case 'created_oldest':
          return new Date(a.created_date) - new Date(b.created_date);
        default:
          return 0;
      }
    });

    return filtered;
  }, [tenants, search, status, portalAccess, sortBy]);

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
    { label: 'Aktiv', value: tenants.filter(t => t.aktiv).length },
    { label: 'Mit Verträgen', value: tenants.filter(t => t.aktiv).length },
    { label: 'Gefiltert', value: filteredTenants.length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-slate-900">Mieter</h1>
          <p className="text-slate-600 mt-1">Verwalten Sie Ihre Mieter und deren Verträge</p>
        </div>
        <FeatureGateInline 
          featureKey="tenant_management"
          currentCount={tenants?.length || 0}
          limitKey="objects"
        >
          <Button onClick={() => setQuickCreateOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Users className="w-4 h-4 mr-2" />
            Neuer Mieter
          </Button>
        </FeatureGateInline>
      </div>

      {/* Enhanced Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Suche nach Name, E-Mail oder Telefonnummer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 text-base"
            />
          </div>
        </CardContent>
      </Card>

      <QuickStats stats={stats} accentColor="green" />

      <TenantFilterBar 
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onPortalAccessChange={setPortalAccess}
        onSortChange={setSortBy}
        onNewTenant={() => {
          toast.error('Neue Mietverträge können nur über eine Einheit erstellt werden.');
        }}
      />

      <TenantTable 
        tenants={filteredTenants}
        onEdit={handleEdit}
        onDelete={(tenant) => deleteMutation.mutate(tenant.id)}
        onSelectionChange={setSelectedIds}
      />

      <TenantBulkActionsBar
        selectedIds={selectedIds}
        tenants={filteredTenants}
        onClose={() => setSelectedIds(new Set())}
      />

      {/* Quick Create Dialog */}
      <QuickTenantDialog
        open={quickCreateOpen}
        onOpenChange={setQuickCreateOpen}
        onSubmit={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
      />

      {/* Full Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTenant ? 'Mieter bearbeiten' : 'Neuer Mieter'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Vorname"
              value={formData.first_name || ''}
              onChange={(e) => setFormData({...formData, first_name: e.target.value})}
            />
            <Input
              placeholder="Nachname"
              value={formData.last_name || ''}
              onChange={(e) => setFormData({...formData, last_name: e.target.value})}
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
                className="bg-slate-700 hover:bg-slate-800 font-extralight"
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