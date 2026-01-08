import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PaymentFilterBar from '@/components/payments/PaymentFilterBar';
import PaymentTable from '@/components/payments/PaymentTable';
import QuickStats from '@/components/shared/QuickStats';

export default function PaymentsPage() {
  const [search, setSearch] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [formData, setFormData] = useState({});
  const queryClient = useQueryClient();

  const { data: payments = [] } = useQuery({
    queryKey: ['payments'],
    queryFn: () => base44.entities.Payment?.list?.() || []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Payment.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['payments'] }); setShowDialog(false); setFormData({}); }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Payment.update(editingPayment.id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['payments'] }); setShowDialog(false); setEditingPayment(null); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Payment.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payments'] })
  });

  const filteredPayments = payments.filter(p => (p.tenant_name || '').toLowerCase().includes(search.toLowerCase()));
  const pendingCount = payments.filter(p => p.status === 'pending' || p.status === 'overdue').length;
  const overdueCount = payments.filter(p => p.status === 'overdue').length;
  const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const stats = [
    { label: 'Gesamtzahlungen', value: `€${totalAmount.toFixed(0)}` },
    { label: 'Ausstehend', value: pendingCount },
    { label: 'Überfällig', value: overdueCount },
    { label: 'Diese Woche eingegangen', value: 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">💳 Zahlungen</h1>
        <p className="text-slate-600 mt-1">Verwalten Sie Mietzahlungen und Zahlungsstatus</p>
      </div>
      <QuickStats stats={stats} accentColor="violet" />
      <PaymentFilterBar onSearchChange={setSearch} onNewPayment={() => { setEditingPayment(null); setFormData({}); setShowDialog(true); }} />
      <PaymentTable payments={filteredPayments} onEdit={(p) => { setEditingPayment(p); setFormData(p); setShowDialog(true); }} onDelete={(p) => deleteMutation.mutate(p.id)} />
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingPayment ? 'Zahlung bearbeiten' : 'Neue Zahlung'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Mieter" value={formData.tenant_name || ''} onChange={(e) => setFormData({...formData, tenant_name: e.target.value})} />
            <Input placeholder="Einheit" value={formData.unit_name || ''} onChange={(e) => setFormData({...formData, unit_name: e.target.value})} />
            <Input placeholder="Betrag" type="number" value={formData.amount || ''} onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value)})} />
            <Input placeholder="Fällig am" type="date" value={formData.due_date || ''} onChange={(e) => setFormData({...formData, due_date: e.target.value})} />
            <Select value={formData.status || ''} onValueChange={(value) => setFormData({...formData, status: value})}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Ausstehend</SelectItem>
                <SelectItem value="completed">Abgeschlossen</SelectItem>
                <SelectItem value="overdue">Überfällig</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowDialog(false)}>Abbrechen</Button>
              <Button onClick={() => editingPayment ? updateMutation.mutate(formData) : createMutation.mutate(formData)} className="bg-violet-600 hover:bg-violet-700">Speichern</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}