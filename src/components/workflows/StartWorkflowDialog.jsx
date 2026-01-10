import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

export default function StartWorkflowDialog({ companyId, onClose, onSuccess }) {
  const [selectedWorkflow, setSelectedWorkflow] = useState('');

  const { data: workflows = [] } = useQuery({
    queryKey: ['workflows', companyId],
    queryFn: async () => {
      const result = await base44.asServiceRole.entities.WorkflowAutomation.filter({
        company_id: companyId,
        is_active: true
      });
      return result;
    }
  });

  const startMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('executeWorkflowInstance', {
        workflow_id: selectedWorkflow,
        company_id: companyId
      }),
    onSuccess: () => {
      onSuccess();
    }
  });

  const selectedWorkflowData = workflows.find(w => w.id === selectedWorkflow);

  const handleStart = () => {
    if (selectedWorkflow) {
      startMutation.mutate();
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Workflow starten</DialogTitle>
          <DialogDescription>
            Wählen Sie einen Workflow aus und starten Sie eine neue Ausführungsinstanz
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Workflow auswählen</label>
            <Select value={selectedWorkflow} onValueChange={setSelectedWorkflow}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Wählen Sie einen Workflow..." />
              </SelectTrigger>
              <SelectContent>
                {workflows.map(workflow => (
                  <SelectItem key={workflow.id} value={workflow.id}>
                    {workflow.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Workflow Preview */}
          {selectedWorkflowData && (
            <Card className="bg-slate-50">
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div>
                    <p className="text-xs font-medium text-slate-700">Name</p>
                    <p className="text-sm text-slate-900">{selectedWorkflowData.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-700">Beschreibung</p>
                    <p className="text-sm text-slate-600">{selectedWorkflowData.description}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-700">Schritte</p>
                    <p className="text-sm text-slate-600">{selectedWorkflowData.steps?.length || 0} Schritte</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Abbrechen
            </Button>
            <Button
              onClick={handleStart}
              disabled={!selectedWorkflow || startMutation.isPending}
              className="flex-1"
            >
              {startMutation.isPending ? 'Startet...' : 'Workflow starten'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}