import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format } from 'date-fns';

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];

export default function WorkflowAnalyticsDashboard({ startDate, endDate, workflowId, companyId }) {
  const { data: analytics = {}, isLoading } = useQuery({
    queryKey: ['workflow-analytics', startDate, endDate, workflowId, companyId],
    queryFn: () =>
      base44.functions.invoke('generateWorkflowAnalytics', {
        company_id: companyId,
        workflow_id: workflowId,
        start_date: startDate,
        end_date: endDate
      }).then(res => res.data)
  });

  if (isLoading) return <div className="text-center py-8">Lädt Analysen...</div>;

  const { metrics = {}, step_completion_rates = [], approval_bottlenecks = [], timeline_data = [] } = analytics;

  const statusData = [
    { name: 'Abgeschlossen', value: metrics.completed || 0, color: '#10b981' },
    { name: 'Fehlgeschlagen', value: metrics.failed || 0, color: '#ef4444' },
    { name: 'Abgebrochen', value: metrics.cancelled || 0, color: '#f59e0b' },
    { name: 'Läuft', value: metrics.running || 0, color: '#3b82f6' }
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-4">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-600">Gesamtausführungen</p>
            <p className="text-2xl font-bold text-slate-900">{metrics.total_executions || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-600">Abschlussrate</p>
            <p className="text-2xl font-bold text-green-600">{metrics.completion_rate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-600">Fehlerrate</p>
            <p className="text-2xl font-bold text-red-600">{metrics.failure_rate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-600">Ø Ausführungszeit</p>
            <p className="text-2xl font-bold text-blue-600">{metrics.avg_execution_time} Min</p>
          </CardContent>
        </Card>
      </div>

      {/* Timeline & Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Ausführungen über Zeit</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeline_data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" style={{ fontSize: '12px' }} />
                <YAxis style={{ fontSize: '12px' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#3b82f6" name="Gesamt" />
                <Line type="monotone" dataKey="completed" stroke="#10b981" name="Abgeschlossen" />
                <Line type="monotone" dataKey="failed" stroke="#ef4444" name="Fehlgeschlagen" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Status-Verteilung</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Step Completion Rates */}
      {step_completion_rates.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Schritt-Abschlussraten</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={step_completion_rates}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="step_id" style={{ fontSize: '12px' }} />
                <YAxis style={{ fontSize: '12px' }} domain={[0, 100]} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Bar dataKey="completion_rate" fill="#10b981" name="Abschlussrate %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Approval Bottlenecks */}
      {approval_bottlenecks.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Genehmigungsengpässe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {approval_bottlenecks.map((bottleneck, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded border border-slate-200">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm text-slate-900">
                      {bottleneck.step_id} ({bottleneck.approval_type})
                    </p>
                    {bottleneck.pending_count > 0 && (
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                        {bottleneck.pending_count} ausstehend
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-600">
                    <span>✓ {bottleneck.approved_count} genehmigt</span>
                    <span>⏳ {bottleneck.pending_count} ausstehend</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}