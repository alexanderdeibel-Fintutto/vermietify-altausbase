import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Play, XCircle, CheckCircle2, Clock } from 'lucide-react';
import WorkflowExecutionDetails from './WorkflowExecutionDetails';
import StartWorkflowDialog from './StartWorkflowDialog';

export default function WorkflowExecutionMonitor({ companyId }) {
  const [selectedExecution, setSelectedExecution] = useState(null);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: executions = [] } = useQuery({
    queryKey: ['workflow-executions', companyId],
    queryFn: async () => {
      const result = await base44.asServiceRole.entities.WorkflowExecution.filter({
        company_id: companyId
      });
      return result.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    }
  });

  const cancelMutation = useMutation({
    mutationFn: (executionId) =>
      base44.functions.invoke('cancelWorkflowExecution', {
        execution_id: executionId
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-executions', companyId] });
    }
  });

  const runningExecutions = executions.filter(e => e.status === 'running');
  const completedExecutions = executions.filter(e => ['completed', 'failed', 'cancelled'].includes(e.status));

  const getStatusBadge = (status) => {
    switch (status) {
      case 'running':
        return <Badge className="bg-blue-100 text-blue-700 animate-pulse">Läuft</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-700">Abgeschlossen</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-700">Fehler</Badge>;
      case 'cancelled':
        return <Badge className="bg-amber-100 text-amber-700">Abgebrochen</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Workflow-Ausführung</h2>
          <p className="text-slate-600 text-sm mt-1">Überwachen Sie laufende und abgeschlossene Workflows</p>
        </div>
        <Button onClick={() => setShowStartDialog(true)} className="gap-2">
          <Play className="w-4 h-4" />
          Workflow starten
        </Button>
      </div>

      {/* Start Workflow Dialog */}
      {showStartDialog && (
        <StartWorkflowDialog
          companyId={companyId}
          onClose={() => setShowStartDialog(false)}
          onSuccess={() => {
            setShowStartDialog(false);
            queryClient.invalidateQueries({ queryKey: ['workflow-executions', companyId] });
          }}
        />
      )}

      <Tabs defaultValue="running">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="running" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Laufend ({runningExecutions.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Abgeschlossen ({completedExecutions.length})
          </TabsTrigger>
        </TabsList>

        {/* Running Executions */}
        <TabsContent value="running" className="space-y-4">
          {runningExecutions.length === 0 ? (
            <Card className="bg-slate-50">
              <CardContent className="pt-6 text-center text-slate-500">
                Keine laufenden Workflows
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {runningExecutions.map(execution => (
                <Card
                  key={execution.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedExecution(execution)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">{execution.workflow_id}</CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          {getStatusBadge(execution.status)}
                          <span className="text-xs text-slate-600">
                            Gestartet: {format(new Date(execution.started_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelMutation.mutate(execution.id);
                        }}
                        className="gap-1"
                      >
                        <XCircle className="w-4 h-4" />
                        Abbrechen
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>{execution.steps_completed?.length || 0} Schritte abgeschlossen</span>
                      {execution.pending_approvals?.length > 0 && (
                        <span className="text-amber-600 font-medium">
                          {execution.pending_approvals.length} Genehmigung(en) ausstehend
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Completed Executions */}
        <TabsContent value="completed" className="space-y-4">
          {completedExecutions.length === 0 ? (
            <Card className="bg-slate-50">
              <CardContent className="pt-6 text-center text-slate-500">
                Keine abgeschlossenen Workflows
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {completedExecutions.map(execution => (
                <Card
                  key={execution.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedExecution(execution)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">{execution.workflow_id}</CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          {getStatusBadge(execution.status)}
                          <span className="text-xs text-slate-600">
                            {format(new Date(execution.completed_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>{execution.steps_completed?.length || 0} Schritte</span>
                      {execution.execution_time_seconds && (
                        <span>{Math.round(execution.execution_time_seconds / 60)} Minuten</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Execution Details Panel */}
      {selectedExecution && (
        <WorkflowExecutionDetails
          execution={selectedExecution}
          onClose={() => setSelectedExecution(null)}
        />
      )}
    </div>
  );
}