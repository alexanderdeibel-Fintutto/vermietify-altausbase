import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function ApprovalQueue() {
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [rejectionComment, setRejectionComment] = useState('');
  const [processing, setProcessing] = useState(false);

  const { data: workflows, isLoading, refetch } = useQuery({
    queryKey: ['approvalWorkflows'],
    queryFn: async () => {
      try {
        const user = await base44.auth.me();
        return await base44.entities.ApprovalWorkflow.filter(
          { 'approvers.approver_email': user.email },
          '-created_at',
          50
        );
      } catch {
        return [];
      }
    }
  });

  const pendingWorkflows = workflows?.filter(w => w.status === 'pending') || [];
  const approvedWorkflows = workflows?.filter(w => w.status === 'approved') || [];
  const rejectedWorkflows = workflows?.filter(w => w.status === 'rejected') || [];

  const handleApprove = async () => {
    if (!selectedWorkflow) return;
    try {
      setProcessing(true);
      await base44.functions.invoke('processApprovalWorkflow', {
        workflow_id: selectedWorkflow.id,
        action: 'approve'
      });
      toast.success('Genehmigt');
      setShowDetailDialog(false);
      refetch();
    } catch (error) {
      toast.error(`Fehler: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedWorkflow) return;
    try {
      setProcessing(true);
      await base44.functions.invoke('processApprovalWorkflow', {
        workflow_id: selectedWorkflow.id,
        action: 'reject',
        comment: rejectionComment
      });
      toast.success('Abgelehnt');
      setShowDetailDialog(false);
      setRejectionComment('');
      refetch();
    } catch (error) {
      toast.error(`Fehler: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const renderWorkflowCard = (workflow) => (
    <Card
      key={workflow.id}
      className="cursor-pointer hover:shadow-md transition"
      onClick={() => {
        setSelectedWorkflow(workflow);
        setShowDetailDialog(true);
      }}
    >
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <p className="font-semibold">{workflow.workflow_name}</p>
            <p className="text-xs text-slate-600 mt-1">Von: {workflow.requester_email}</p>
          </div>
          <Badge className={
            workflow.workflow_type === 'budget_request' ? 'bg-blue-100 text-blue-800' :
            workflow.workflow_type === 'expense_report' ? 'bg-green-100 text-green-800' :
            'bg-purple-100 text-purple-800'
          }>
            {workflow.workflow_type === 'budget_request' ? '💰' : '📋'} {workflow.workflow_type}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-3">
          <p>Priorität: {workflow.priority}</p>
          <p>Status: {workflow.status}</p>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-600">
            Erstellt: {new Date(workflow.created_at).toLocaleDateString('de-DE')}
          </span>
          <Button size="sm" variant="outline" onClick={(e) => {
            e.stopPropagation();
            setSelectedWorkflow(workflow);
            setShowDetailDialog(true);
          }}>
            Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedWorkflow?.workflow_name}</DialogTitle>
          </DialogHeader>

          {selectedWorkflow && (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-600">Antragsteller</p>
                  <p className="font-semibold">{selectedWorkflow.requester_email}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Typ</p>
                  <p className="font-semibold">{selectedWorkflow.workflow_type}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Priorität</p>
                  <p className="font-semibold">{selectedWorkflow.priority}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Status</p>
                  <Badge>{selectedWorkflow.status}</Badge>
                </div>
              </div>

              {selectedWorkflow.content && (
                <div className="bg-slate-50 p-3 rounded">
                  <p className="text-xs font-semibold text-slate-600 mb-2">Inhalt</p>
                  <p className="text-sm text-slate-700">
                    {JSON.stringify(selectedWorkflow.content, null, 2)}
                  </p>
                </div>
              )}

              {selectedWorkflow.status === 'pending' && (
                <>
                  <Textarea
                    placeholder="Optionaler Kommentar..."
                    value={rejectionComment}
                    onChange={(e) => setRejectionComment(e.target.value)}
                    className="min-h-20"
                  />

                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      onClick={handleApprove}
                      disabled={processing}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Verarbeite...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Genehmigen
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleReject}
                      disabled={processing}
                      className="flex-1 bg-red-600 hover:bg-red-700"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Verarbeite...
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 mr-2" />
                          Ablehnen
                        </>
                      )}
                    </Button>
                    <Button onClick={() => setShowDetailDialog(false)} variant="outline" className="flex-1">
                      Schließen
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Ausstehend ({pendingWorkflows.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Genehmigt ({approvedWorkflows.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            Abgelehnt ({rejectedWorkflows.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4 space-y-3">
          {isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : pendingWorkflows.length > 0 ? (
            pendingWorkflows.map(workflow => renderWorkflowCard(workflow))
          ) : (
            <Card className="bg-slate-50">
              <CardContent className="pt-4 text-center">
                <p className="text-sm text-slate-600">Keine ausstehenden Genehmigungen</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-4 space-y-3">
          {approvedWorkflows.length > 0 ? (
            approvedWorkflows.map(workflow => renderWorkflowCard(workflow))
          ) : (
            <Card className="bg-slate-50">
              <CardContent className="pt-4 text-center">
                <p className="text-sm text-slate-600">Keine genehmigten Anfragen</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="mt-4 space-y-3">
          {rejectedWorkflows.length > 0 ? (
            rejectedWorkflows.map(workflow => renderWorkflowCard(workflow))
          ) : (
            <Card className="bg-slate-50">
              <CardContent className="pt-4 text-center">
                <p className="text-sm text-slate-600">Keine abgelehnten Anfragen</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}