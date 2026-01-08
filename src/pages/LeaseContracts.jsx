import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ContractFilterBar from '@/components/contracts/ContractFilterBar';
import ContractTable from '@/components/contracts/ContractTable';
import QuickStats from '@/components/shared/QuickStats';

export default function LeaseContractsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [showDialog, setShowDialog] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [formData, setFormData] = useState({});
  const queryClient = useQueryClient();

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => base44.entities.LeaseContract.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.LeaseContract.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      setShowDialog(false);
      setFormData({});
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.LeaseContract.update(editingContract.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      setShowDialog(false);
      setEditingContract(null);
      setFormData({});
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.LeaseContract.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    }
  });

  const filteredContracts = contracts.filter(c => 
    (c.tenant_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = () => {
    if (editingContract) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const totalRent = contracts.reduce((sum, c) => sum + (c.rent_amount || 0), 0);

  const stats = [
    { label: 'Aktive Verträge', value: contracts.length },
    { label: 'Monatliche Miete', value: `€${totalRent.toFixed(0)}` },
    { label: 'Verträge diese Woche', value: 0 },
    { label: 'Kündigungen anstehend', value: 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">📋 Mietverträge</h1>
        <p className="text-slate-600 mt-1">Verwalten Sie Ihre Mietverträge und Mietzahlungen</p>
      </div>

      <QuickStats stats={stats} accentColor="blue" />

      <ContractFilterBar 
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onNewContract={() => {
          setEditingContract(null);
          setFormData({});
          setShowDialog(true);
        }}
      />

      <ContractTable 
        contracts={filteredContracts}
        onEdit={(contract) => {
          setEditingContract(contract);
          setFormData(contract);
          setShowDialog(true);
        }}
        onDelete={(contract) => deleteMutation.mutate(contract.id)}
      />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingContract ? 'Vertrag bearbeiten' : 'Neuer Vertrag'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Mieter"
              value={formData.tenant_name || ''}
              onChange={(e) => setFormData({...formData, tenant_name: e.target.value})}
            />
            <Input
              placeholder="Wohneinheit"
              value={formData.unit_name || ''}
              onChange={(e) => setFormData({...formData, unit_name: e.target.value})}
            />
            <Input
              placeholder="Miete"
              type="number"
              value={formData.rent_amount || ''}
              onChange={(e) => setFormData({...formData, rent_amount: parseFloat(e.target.value)})}
            />
            <Input
              placeholder="Startdatum"
              type="date"
              value={formData.start_date || ''}
              onChange={(e) => setFormData({...formData, start_date: e.target.value})}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowDialog(false)}>Abbrechen</Button>
              <Button 
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-700"
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