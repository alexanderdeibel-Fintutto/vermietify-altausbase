import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import InvoiceFilterBar from '@/components/invoices/InvoiceFilterBar';
import InvoiceListTable from '@/components/invoices/InvoiceListTable';
import QuickStats from '@/components/shared/QuickStats';

export default function InvoiceManagementPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [showDialog, setShowDialog] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [formData, setFormData] = useState({});
  const queryClient = useQueryClient();

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.Invoice.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Invoice.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setShowDialog(false);
      setFormData({});
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Invoice.update(editingInvoice.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setShowDialog(false);
      setEditingInvoice(null);
      setFormData({});
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Invoice.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    }
  });

  const filteredInvoices = invoices.filter(inv => 
    (inv.recipient_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalAmount = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const paidAmount = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.amount || 0), 0);

  const stats = [
    { label: 'Gesamt-Rechnungen', value: invoices.length },
    { label: 'Gesamtbetrag', value: `€${totalAmount.toFixed(0)}` },
    { label: 'Bezahlt', value: `€${paidAmount.toFixed(0)}` },
    { label: 'Ausstehend', value: `€${(totalAmount - paidAmount).toFixed(0)}` },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">💰 Rechnungen</h1>
        <p className="text-slate-600 mt-1">Verwalten Sie Ihre Rechnungen und Zahlungen</p>
      </div>

      <QuickStats stats={stats} accentColor="orange" />

      <InvoiceFilterBar 
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onNewInvoice={() => {
          setEditingInvoice(null);
          setFormData({});
          setShowDialog(true);
        }}
      />

      <InvoiceListTable 
        invoices={filteredInvoices}
        onEdit={(invoice) => {
          setEditingInvoice(invoice);
          setFormData(invoice);
          setShowDialog(true);
        }}
        onDelete={(invoice) => deleteMutation.mutate(invoice.id)}
        onDownload={() => {}} // TODO: PDF download
      />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingInvoice ? 'Rechnung bearbeiten' : 'Neue Rechnung'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Empfänger"
              value={formData.recipient_name || ''}
              onChange={(e) => setFormData({...formData, recipient_name: e.target.value})}
            />
            <Input
              placeholder="Betrag"
              type="number"
              value={formData.amount || ''}
              onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value)})}
            />
            <Input
              placeholder="Datum"
              type="date"
              value={formData.date || ''}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowDialog(false)}>Abbrechen</Button>
              <Button 
                onClick={() => {
                  if (editingInvoice) {
                    updateMutation.mutate(formData);
                  } else {
                    createMutation.mutate(formData);
                  }
                }}
                className="bg-orange-600 hover:bg-orange-700"
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