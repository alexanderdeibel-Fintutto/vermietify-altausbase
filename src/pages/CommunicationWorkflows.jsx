import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Send, Calendar, AlertCircle, Mail, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import WorkflowFormDialog from '@/components/communication/WorkflowFormDialog';
import WorkflowExecutionLog from '@/components/communication/WorkflowExecutionLog';

export default function CommunicationWorkflows() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [logOpen, setLogOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data: workflows = [] } = useQuery({
    queryKey: ['communicationWorkflows'],
    queryFn: () => base44.entities.CommunicationWorkflow.list('-created_date', 100)
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, ist_aktiv }) => base44.entities.CommunicationWorkflow.update(id, { ist_aktiv }),
    onSuccess: () => {
      queryClient.invalidateQueries(['communicationWorkflows']);
      toast.success('Workflow aktualisiert');
    }
  });

  const testWorkflowMutation = useMutation({
    mutationFn: async (workflowId) => {
      const response = await base44.functions.invoke('executeCommunicationWorkflow', {
        workflow_id: workflowId,
        test_mode: true
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Test abgeschlossen: ${data.sent_count} Nachricht(en) würden versendet`);
    }
  });

  const workflowIcons = {
    'Mietzahlungserinnerung': Mail,
    'Vertragsverlängerung': Calendar,
    'Wartungsanfrage': MessageSquare,
    'Betriebskostenabrechnung': Mail,
    'Kündigung': AlertCircle,
    'Benutzerdefiniert': Send
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-slate-900">Kommunikations-Workflows</h1>
          <p className="text-slate-600 mt-1">Automatisierte Mieter-Benachrichtigungen</p>
        </div>
        <Button onClick={() => { setSelectedWorkflow(null); setDialogOpen(true); }} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Neuer Workflow
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workflows.map(workflow => {
          const Icon = workflowIcons[workflow.workflow_type] || Send;

          return (
            <Card key={workflow.id} className={workflow.ist_aktiv ? 'border-blue-200' : 'border-slate-200 opacity-60'}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${workflow.ist_aktiv ? 'bg-blue-100' : 'bg-slate-100'}`}>
                      <Icon className={`w-4 h-4 ${workflow.ist_aktiv ? 'text-blue-600' : 'text-slate-400'}`} />
                    </div>
                    <div>
                      <CardTitle className="text-sm">{workflow.name}</CardTitle>
                      <p className="text-xs text-slate-500 mt-0.5">{workflow.workflow_type}</p>
                    </div>
                  </div>
                  <Switch
                    checked={workflow.ist_aktiv}
                    onCheckedChange={(checked) => toggleMutation.mutate({ id: workflow.id, ist_aktiv: checked })}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Trigger:</span>
                    <span className="font-medium">{workflow.trigger_type}</span>
                  </div>
                  {workflow.trigger_offset_days !== 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Offset:</span>
                      <span className="font-medium">
                        {workflow.trigger_offset_days > 0 ? '+' : ''}{workflow.trigger_offset_days} Tage
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Versendungen:</span>
                    <Badge variant="outline" className="text-xs">{workflow.anzahl_versendungen || 0}</Badge>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => testWorkflowMutation.mutate(workflow.id)}
                    disabled={testWorkflowMutation.isPending}
                  >
                    {testWorkflowMutation.isPending ? 'Teste...' : 'Testen'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => { setSelectedWorkflow(workflow); setDialogOpen(true); }}
                  >
                    Bearbeiten
                  </Button>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full text-xs"
                  onClick={() => { setSelectedWorkflow(workflow); setLogOpen(true); }}
                >
                  Versandprotokoll anzeigen
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {workflows.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Send className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 mb-4">Keine Workflows konfiguriert</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Ersten Workflow erstellen
            </Button>
          </CardContent>
        </Card>
      )}

      <WorkflowFormDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setSelectedWorkflow(null); }}
        workflow={selectedWorkflow}
      />

      <WorkflowExecutionLog
        open={logOpen}
        onClose={() => { setLogOpen(false); setSelectedWorkflow(null); }}
        workflow={selectedWorkflow}
      />
    </div>
  );
}