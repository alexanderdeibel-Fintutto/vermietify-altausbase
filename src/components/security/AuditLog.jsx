import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileText, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function AuditLog() {
  const { data: logs = [] } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: async () => {
      const activities = await base44.entities.UserActivity.list('-created_date', 100);
      return activities;
    }
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const csv = logs.map(log => 
        `${log.created_date},${log.created_by},${log.action}`
      ).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'audit-log.csv';
      a.click();
    },
    onSuccess: () => {
      toast.success('Audit-Log exportiert');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Audit-Trail
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button onClick={() => exportMutation.mutate()} className="w-full">
          <Download className="w-4 h-4 mr-2" />
          Audit-Log exportieren
        </Button>
        <div className="max-h-64 overflow-y-auto space-y-1">
          {logs.map(log => (
            <div key={log.id} className="p-2 bg-slate-50 rounded text-xs">
              <p className="font-semibold">{log.action}</p>
              <p className="text-slate-600">{log.created_by} - {new Date(log.created_date).toLocaleString('de-DE')}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}