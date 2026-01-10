import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, FileText } from 'lucide-react';
import WorkflowAnalyticsDashboard from './WorkflowAnalyticsDashboard';

export default function WorkflowReportBuilder({ companyId }) {
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedWorkflow, setSelectedWorkflow] = useState('all');
  const [reportOptions, setReportOptions] = useState({
    include_timeline: true,
    include_steps: true,
    include_approvals: true,
    include_summary: true
  });

  const { data: workflows = [] } = useQuery({
    queryKey: ['workflows-list', companyId],
    queryFn: async () => {
      const result = await base44.asServiceRole.entities.WorkflowAutomation.filter({
        company_id: companyId
      });
      return result;
    }
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const analyticsRes = await base44.functions.invoke('generateWorkflowAnalytics', {
        company_id: companyId,
        workflow_id: selectedWorkflow === 'all' ? undefined : selectedWorkflow,
        start_date: startDate,
        end_date: endDate
      });

      const data = analyticsRes.data;

      // Create CSV
      let csv = 'Workflow Ausführungsbericht\n';
      csv += `Zeitraum: ${startDate} bis ${endDate}\n\n`;

      if (reportOptions.include_summary) {
        csv += 'ZUSAMMENFASSUNG\n';
        csv += `Gesamtausführungen,${data.metrics?.total_executions || 0}\n`;
        csv += `Abschlussrate,${data.metrics?.completion_rate}%\n`;
        csv += `Fehlerrate,${data.metrics?.failure_rate}%\n`;
        csv += `Ø Ausführungszeit,${data.metrics?.avg_execution_time} Minuten\n\n`;
      }

      if (reportOptions.include_steps && data.step_completion_rates?.length > 0) {
        csv += 'SCHRITT-ABSCHLUSSRATEN\n';
        csv += 'Schritt ID,Abschlussrate %,Ausführungen\n';
        data.step_completion_rates.forEach(step => {
          csv += `${step.step_id},${step.completion_rate},${step.total_executions}\n`;
        });
        csv += '\n';
      }

      if (reportOptions.include_approvals && data.approval_bottlenecks?.length > 0) {
        csv += 'GENEHMIGUNGSENGPÄSSE\n';
        csv += 'Schritt,Typ,Genehmigt,Ausstehend\n';
        data.approval_bottlenecks.forEach(bottleneck => {
          csv += `${bottleneck.step_id},${bottleneck.approval_type},${bottleneck.approved_count},${bottleneck.pending_count}\n`;
        });
      }

      // Download
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `workflow-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  });

  return (
    <div className="space-y-4">
      {/* Report Builder */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Berichtseinstellungen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Startdatum</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Enddatum</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Workflow</label>
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

          {/* Report Options */}
          <div className="space-y-2 pt-2 border-t">
            <p className="text-sm font-medium text-slate-700">In den Bericht einbeziehen:</p>
            {[
              { key: 'include_summary', label: 'Zusammenfassung' },
              { key: 'include_timeline', label: 'Zeitleiste' },
              { key: 'include_steps', label: 'Schritt-Abschlussraten' },
              { key: 'include_approvals', label: 'Genehmigungsengpässe' }
            ].map(option => (
              <label key={option.key} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={reportOptions[option.key]}
                  onCheckedChange={(checked) =>
                    setReportOptions(prev => ({ ...prev, [option.key]: checked }))
                  }
                />
                <span className="text-sm text-slate-700">{option.label}</span>
              </label>
            ))}
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={() => exportMutation.mutate()}
              disabled={exportMutation.isPending}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              {exportMutation.isPending ? 'Exportiert...' : 'Als CSV exportieren'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Dashboard */}
      <WorkflowAnalyticsDashboard
        startDate={startDate}
        endDate={endDate}
        workflowId={selectedWorkflow === 'all' ? undefined : selectedWorkflow}
        companyId={companyId}
      />
    </div>
  );
}