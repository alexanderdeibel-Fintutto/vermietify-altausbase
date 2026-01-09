import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import TaxFilterBar from '@/components/tax/TaxFilterBar';
import TaxFormTable from '@/components/tax/TaxFormTable';
import QuickStats from '@/components/shared/QuickStats';

export default function TaxManagementPage() {
  const [search, setSearch] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: forms = [] } = useQuery({
    queryKey: ['tax-forms'],
    queryFn: () => base44.entities.ElsterSubmission?.list?.() || []
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ElsterSubmission.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tax-forms'] })
  });

  const filteredForms = forms.filter(f => (f.form_type || '').toLowerCase().includes(search.toLowerCase()));
  const submittedCount = forms.filter(f => f.status === 'submitted').length;

  const stats = [
    { label: 'Gesamt-Formulare', value: forms.length },
    { label: 'Eingereicht', value: submittedCount },
    { label: 'In Bearbeitung', value: forms.length - submittedCount },
    { label: 'Abgelaufen', value: 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extralight text-slate-600 tracking-wide">Steuern & ELSTER</h1>
        <p className="text-sm font-extralight text-slate-400 mt-1">Verwalten Sie Ihre Steuererklärungen und ELSTER-Übermittlungen</p>
      </div>
      <QuickStats stats={stats} />
      <TaxFilterBar onSearchChange={setSearch} onNewForm={() => setShowDialog(true)} />
      <TaxFormTable forms={filteredForms} onEdit={() => {}} onDelete={(f) => deleteMutation.mutate(f.id)} onDownload={() => {}} />
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Neues Steuerformular</DialogTitle></DialogHeader>
          <p className="text-slate-600">Setup-Assistent wird geladen...</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}