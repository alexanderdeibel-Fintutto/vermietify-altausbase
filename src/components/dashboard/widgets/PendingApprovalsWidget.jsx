import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

export default function PendingApprovalsWidget() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: executions = [] } = useQuery({
    queryKey: ['pending-approvals', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      
      const result = await base44.asServiceRole.entities.WorkflowExecution.filter({
        status: 'running'
      });

      return result.filter(exec => 
        exec.pending_approvals?.some(approval =>
          approval.required_approvers.includes(user.email)
        )
      );
    },
    enabled: !!user?.email
  });

  const allPendingApprovals = executions.flatMap(exec =>
    exec.pending_approvals
      ?.filter(approval => approval.required_approvers.includes(user?.email))
      .map(approval => ({ ...approval, workflow_id: exec.workflow_id, execution_id: exec.id })) || []
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-600" />
          Ausstehende Genehmigungen
        </CardTitle>
      </CardHeader>
      <CardContent>
        {allPendingApprovals.length === 0 ? (
          <p className="text-sm text-slate-600 text-center py-4">Keine ausstehenden Genehmigungen</p>
        ) : (
          <div className="space-y-3">
            {allPendingApprovals.slice(0, 5).map(approval => (
              <div
                key={approval.approval_id}
                className="p-3 bg-amber-50 rounded-lg border border-amber-200"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{approval.workflow_id}</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Verfällt: {format(new Date(approval.expires_at), 'dd.MM HH:mm', { locale: de })}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      size="sm"
                      className="h-7 w-7 p-0 bg-green-600 hover:bg-green-700"
                      title="Genehmigen"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 w-7 p-0"
                      title="Ablehnen"
                    >
                      <XCircle className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {allPendingApprovals.length > 5 && (
              <p className="text-xs text-slate-600 text-center pt-2">
                +{allPendingApprovals.length - 5} weitere
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}