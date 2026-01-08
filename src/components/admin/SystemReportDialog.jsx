import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, Loader2, Download } from 'lucide-react';
import { toast } from 'sonner';
import ExportButton from '../reports/ExportButton.jsx';

export default function SystemReportDialog() {
  const [open, setOpen] = useState(false);
  const [report, setReport] = useState(null);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('generateSystemReport', {
        reportType: 'full'
      });
      return response.data;
    },
    onSuccess: (data) => {
      setReport(data.report);
      toast.success('Report generiert');
    }
  });

  const downloadReport = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system_report_${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileText className="w-4 h-4 mr-2" />
          System Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>System Report generieren</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="w-full"
          >
            {generateMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generiere...</>
            ) : (
              <><FileText className="w-4 h-4 mr-2" /> Report generieren</>
            )}
          </Button>

          {report && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-3">
                  <div className="text-sm text-slate-600">Benutzer</div>
                  <div className="text-2xl font-bold">{report.summary.users.total}</div>
                </Card>
                <Card className="p-3">
                  <div className="text-sm text-slate-600">Rollen</div>
                  <div className="text-2xl font-bold">{report.summary.roles.total}</div>
                </Card>
                <Card className="p-3">
                  <div className="text-sm text-slate-600">Permissions</div>
                  <div className="text-2xl font-bold">{report.summary.permissions.total}</div>
                </Card>
                <Card className="p-3">
                  <div className="text-sm text-slate-600">Aktive Module</div>
                  <div className="text-2xl font-bold">{report.summary.modules.active}</div>
                </Card>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg space-y-2 text-sm">
                <div><strong>Admins:</strong> {report.summary.users.admins}</div>
                <div><strong>Tester:</strong> {report.summary.users.testers}</div>
                <div><strong>API Keys:</strong> {report.summary.apiKeys.total} ({report.summary.apiKeys.active} aktiv)</div>
                <div><strong>Test-Sessions:</strong> {report.summary.testing.totalSessions}</div>
                <div><strong>Aktivitäten (24h):</strong> {report.summary.activity.last24h}</div>
              </div>

              <div className="flex gap-2">
                <Button onClick={downloadReport} variant="outline" className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  JSON
                </Button>
                <ExportButton 
                  reportType="System Report"
                  reportData={report}
                  className="flex-1"
                />
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}