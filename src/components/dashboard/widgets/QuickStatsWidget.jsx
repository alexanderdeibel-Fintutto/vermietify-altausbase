import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function QuickStatsWidget() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: stats = {} } = useQuery({
    queryKey: ['quick-stats', user?.email],
    queryFn: async () => {
      if (!user?.email) return {};

      const [tasks, workflows, approvals] = await Promise.all([
        base44.asServiceRole.entities.DocumentTask.filter({ assigned_to: user.email, status: 'open' }),
        base44.asServiceRole.entities.WorkflowExecution.filter({ status: 'running' }),
        Promise.resolve([]) // Approvals are in workflows
      ]);

      const pendingApprovals = workflows.flatMap(w =>
        w.pending_approvals?.filter(a => a.required_approvers.includes(user.email)) || []
      );

      return {
        openTasks: tasks.length,
        runningWorkflows: workflows.length,
        pendingApprovals: pendingApprovals.length
      };
    },
    enabled: !!user?.email
  });

  const statItems = [
    {
      label: 'Offene Aufgaben',
      value: stats.openTasks || 0,
      color: 'text-purple-600'
    },
    {
      label: 'Laufende Workflows',
      value: stats.runningWorkflows || 0,
      color: 'text-blue-600'
    },
    {
      label: 'Ausstehende Genehmigungen',
      value: stats.pendingApprovals || 0,
      color: 'text-orange-600'
    }
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Schnellstatistiken</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {statItems.map(item => (
            <div key={item.label} className="flex items-center justify-between p-2 bg-slate-50 rounded">
              <span className="text-sm text-slate-700">{item.label}</span>
              <span className={`text-2xl font-bold ${item.color}`}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}