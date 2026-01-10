import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Edit, Activity } from 'lucide-react';
import WorkflowBuilder from './WorkflowBuilder';

export default function WorkflowsList({ companyId }) {
  const [builderOpen, setBuilderOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const queryClient = useQueryClient();

  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ['workflows', companyId],
    queryFn: async () => {
      const all = await base44.entities.DocumentWorkflow.filter({ company_id: companyId });
      return all.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    }
  });

  const toggleMutation = useMutation({
    mutationFn: (workflow) => 
      base44.asServiceRole.entities.DocumentWorkflow.update(workflow.id, {
        is_active: !workflow.is_active
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workflows', companyId] })
  });

  const deleteMutation = useMutation({
    mutationFn: (workflowId) => 
      base44.asServiceRole.entities.DocumentWorkflow.delete(workflowId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workflows', companyId] })
  });

  const triggerLabels = {
    document_created: 'Dokument erstellt',
    document_archived: 'Dokument archiviert',
    signature_requested: 'Signatur angefordert',
    signature_completed: 'Signatur abgeschlossen'
  };

  const handleBuilderClose = () => {
    setBuilderOpen(false);
    setSelectedWorkflow(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-900">Workflows</h2>
        <Button
          onClick={() => {
            setSelectedWorkflow(null);
            setBuilderOpen(true);
          }}
          className="gap-1"
        >
          <Plus className="w-4 h-4" />
          Neuer Workflow
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map(i => (
            <div key={i} className="h-20 bg-slate-200 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : workflows.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-8">
            <Activity className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-500">Keine Workflows erstellt</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {workflows.map(workflow => (
            <Card key={workflow.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-slate-900">{workflow.name}</h3>
                      <Badge variant={workflow.is_active ? 'default' : 'secondary'}>
                        {workflow.is_active ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{workflow.description}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-slate-500">
                        Trigger: {triggerLabels[workflow.trigger_type]}
                      </span>
                      <span className="text-xs text-slate-500">
                        {workflow.actions.length} Aktion(en)
                      </span>
                      {workflow.execution_count > 0 && (
                        <span className="text-xs text-green-600 font-medium">
                          {workflow.execution_count}x ausgeführt
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={workflow.is_active}
                        onCheckedChange={() => toggleMutation.mutate(workflow)}
                        disabled={toggleMutation.isPending}
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedWorkflow(workflow);
                        setBuilderOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteMutation.mutate(workflow.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <WorkflowBuilder
        isOpen={builderOpen}
        onClose={handleBuilderClose}
        companyId={companyId}
        workflow={selectedWorkflow}
      />
    </div>
  );
}