import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Activity, TrendingUp, AlertTriangle, Clock } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { de } from 'date-fns/locale';
import WorkflowMetricsCards from '@/components/workflows/WorkflowMetricsCards';
import RecentActivityWidget from '@/components/workflows/RecentActivityWidget';
import BottlenecksList from '@/components/workflows/BottlenecksList';

export default function WorkflowAutomationDashboard() {
  const [dateRange, setDateRange] = useState('30');
  const [selectedWorkflow, setSelectedWorkflow] = useState('all');

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: building } = useQuery({
    queryKey: ['building', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const buildings = await base44.asServiceRole.entities.Building.filter({
        created_by: user.email
      }, '-created_date', 1);
      return buildings[0];
    },
    enabled: !!user?.email
  });

  const companyId = building?.company_id || user?.company_id;

  const { data: workflows = [] } = useQuery({
    queryKey: ['workflows', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const result = await base44.asServiceRole.entities.WorkflowAutomation.filter({
        company_id: companyId
      });
      return result;
    },
    enabled: !!companyId
  });

  const { data: executions = [] } = useQuery({
    queryKey: ['workflow-executions', companyId, dateRange, selectedWorkflow],
    queryFn: async () => {
      if (!companyId) return [];
      const cutoffDate = subDays(new Date(), parseInt(dateRange));
      const result = await base44.asServiceRole.entities.WorkflowExecution.filter({
        company_id: companyId
      });
      
      return result.filter(ex => {
        const execDate = new Date(ex.started_at);
        if (execDate < cutoffDate) return false;
        if (selectedWorkflow !== 'all' && ex.workflow_id !== selectedWorkflow) return false;
        return true;
      });
    },
    enabled: !!companyId
  });

  // Calculate metrics
  const calculateMetrics = () => {
    const total = executions.length;
    const completed = executions.filter(e => e.status === 'completed').length;
    const failed = executions.filter(e => e.status === 'failed').length;
    const running = executions.filter(e => e.status === 'running').length;

    const avgDuration = total > 0
      ? executions.reduce((sum, ex) => sum + (ex.execution_time_seconds || 0), 0) / total
      : 0;

    const successRate = total > 0 ? (completed / total * 100).toFixed(2) : 0;

    return {
      total_executions: total,
      completed_executions: completed,
      failed_executions: failed,
      running_executions: running,
      average_duration_seconds: Math.round(avgDuration),
      success_rate: parseFloat(successRate),
      active_workflows: workflows.filter(w => w.is_active).length,
      total_workflows: workflows.length
    };
  };

  const metrics = calculateMetrics();

  // Get AI bottleneck analysis
  const bottleneckMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('analyzeWorkflowBottlenecks', {
        company_id: companyId,
        workflow_id: selectedWorkflow !== 'all' ? selectedWorkflow : null,
        days: parseInt(dateRange)
      })
  });

  React.useEffect(() => {
    if (companyId && executions.length > 0) {
      bottleneckMutation.mutate();
    }
  }, [companyId, dateRange, selectedWorkflow]);

  if (!companyId) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-slate-500">Lade Daten...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Workflow Automation Dashboard</h1>
        <p className="text-slate-600 mt-1">
          Übersicht der Workflow-Ausführungen und Performance-Metriken
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium">Zeitraum</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Letzte 7 Tage</SelectItem>
                  <SelectItem value="30">Letzte 30 Tage</SelectItem>
                  <SelectItem value="90">Letzte 90 Tage</SelectItem>
                  <SelectItem value="365">Letztes Jahr</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium">Workflow</label>
              <Select value={selectedWorkflow} onValueChange={setSelectedWorkflow}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Workflows</SelectItem>
                  {workflows.map(wf => (
                    <SelectItem key={wf.id} value={wf.id}>
                      {wf.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <WorkflowMetricsCards metrics={metrics} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="col-span-2">
          <RecentActivityWidget executions={executions.slice(0, 10)} />
        </div>

        {/* Summary Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Zusammenfassung</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Erfolgsquote</span>
                <span className="text-2xl font-bold text-green-600">{metrics.success_rate}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${metrics.success_rate}%` }}
                />
              </div>
            </div>

            <div className="pt-4 border-t space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Ø Ausführungszeit</span>
                <Badge variant="outline">{metrics.average_duration_seconds}s</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Aktive Workflows</span>
                <Badge variant="outline">{metrics.active_workflows}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Laufende Ausführungen</span>
                <Badge className="bg-blue-100 text-blue-700">
                  {metrics.running_executions}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottlenecks Section */}
      <BottlenecksList
        bottlenecks={bottleneckMutation.data?.bottlenecks || []}
        suggestions={bottleneckMutation.data?.suggestions || []}
        isLoading={bottleneckMutation.isPending}
      />

      {/* Execution Time Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Ausführungszeit Verteilung
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {executions.length === 0 ? (
              <p className="text-sm text-slate-500">Keine Daten verfügbar</p>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Schnell (&lt;60s)</span>
                  <Badge>
                    {executions.filter(e => e.execution_time_seconds < 60).length}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Moderat (60-300s)</span>
                  <Badge>
                    {executions.filter(e => e.execution_time_seconds >= 60 && e.execution_time_seconds < 300).length}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Langsam (&gt;300s)</span>
                  <Badge>
                    {executions.filter(e => e.execution_time_seconds >= 300).length}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}