import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function ExecutionMonitor({ workflowId = null }) {
  const { data: executions = [] } = useQuery({
    queryKey: ['execution-logs', workflowId],
    queryFn: () => base44.entities.ExecutionLog?.list?.('-updated_date', 50) || []
  });

  const filteredExecutions = workflowId
    ? executions.filter(e => e.workflow_id === workflowId)
    : executions.slice(0, 10);

  const getStatusIcon = (status) => {
    if (status === 'running') return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
    if (status === 'success') return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
    if (status === 'failed') return <AlertCircle className="w-5 h-5 text-red-600" />;
    return null;
  };

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm">Kürzliche Ausführungen</h3>
      {filteredExecutions.length === 0 ? (
        <p className="text-sm text-slate-500">Keine Ausführungen</p>
      ) : (
        filteredExecutions.map(execution => (
          <Card key={execution.id} className="p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 flex-1">
                {getStatusIcon(execution.status)}
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Step {execution.steps_completed}/{execution.total_steps}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    {execution.duration_ms}ms
                  </p>
                </div>
              </div>
              <Badge variant={
                execution.status === 'success' ? 'default' :
                execution.status === 'failed' ? 'destructive' :
                'secondary'
              }>
                {execution.status}
              </Badge>
            </div>
            {execution.error_message && (
              <p className="text-xs text-red-600 mt-2 p-2 bg-red-50 rounded">
                {execution.error_message}
              </p>
            )}
          </Card>
        ))
      )}
    </div>
  );
}