import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Zap } from 'lucide-react';

export default function WorkflowStatusWidget() {
  const { data: executions = [] } = useQuery({
    queryKey: ['workflow-executions-widget'],
    queryFn: async () => {
      const result = await base44.asServiceRole.entities.WorkflowExecution.filter({
        status: 'running'
      });
      return result.slice(0, 5);
    }
  });

  const getCompletionPercentage = (execution) => {
    if (!execution.steps_completed) return 0;
    const total = (execution.steps_completed?.length || 0) + (execution.pending_approvals?.length || 0);
    return total > 0 ? Math.round((execution.steps_completed.length / total) * 100) : 0;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="w-4 h-4 text-purple-600" />
          Workflow-Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        {executions.length === 0 ? (
          <p className="text-sm text-slate-600 text-center py-4">Keine laufenden Workflows</p>
        ) : (
          <div className="space-y-3">
            {executions.map(execution => (
              <div key={execution.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {execution.workflow_id}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {getCompletionPercentage(execution)}%
                  </Badge>
                </div>
                <Progress value={getCompletionPercentage(execution)} className="h-1.5" />
                <p className="text-xs text-slate-600">
                  {execution.steps_completed?.length || 0} von {(execution.steps_completed?.length || 0) + (execution.pending_approvals?.length || 0)} Schritte
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}