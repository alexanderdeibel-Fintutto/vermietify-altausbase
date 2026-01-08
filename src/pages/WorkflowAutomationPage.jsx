import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import WorkflowFilterBar from '@/components/workflows/WorkflowFilterBar';
import WorkflowTable from '@/components/workflows/WorkflowTable';
import QuickStats from '@/components/shared/QuickStats';

export default function WorkflowAutomationPage() {
  const [search, setSearch] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: workflows = [] } = useQuery({
    queryKey: ['workflows'],
    queryFn: () => base44.entities.Workflow?.list?.() || []
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Workflow.update(data.id, { is_active: !data.is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workflows'] })
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Workflow.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workflows'] })
  });

  const filteredWorkflows = workflows.filter(w => (w.name || '').toLowerCase().includes(search.toLowerCase()));
  const activeCount = workflows.filter(w => w.is_active).length;

  const stats = [
    { label: 'Gesamt-Workflows', value: workflows.length },
    { label: 'Aktiv', value: activeCount },
    { label: 'Inaktiv', value: workflows.length - activeCount },
    { label: 'Ausführungen/Monat', value: 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">⚙️ Workflow Automation</h1>
        <p className="text-slate-600 mt-1">Automatisieren Sie Ihre Geschäftsprozesse</p>
      </div>
      <QuickStats stats={stats} accentColor="cyan" />
      <WorkflowFilterBar onSearchChange={setSearch} onNewWorkflow={() => setShowDialog(true)} />
      <WorkflowTable workflows={filteredWorkflows} onEdit={() => {}} onDelete={(w) => deleteMutation.mutate(w.id)} onToggle={(w) => updateMutation.mutate(w)} />
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Neuer Workflow</DialogTitle></DialogHeader>
          <p className="text-slate-600">Workflow-Builder wird geladen...</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}