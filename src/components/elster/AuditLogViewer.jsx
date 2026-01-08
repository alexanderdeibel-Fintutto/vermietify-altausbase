import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, CheckCircle, Send, Archive, Edit, Eye } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function AuditLogViewer({ submissionId }) {
  const { data: logs = [] } = useQuery({
    queryKey: ['audit-logs', submissionId],
    queryFn: async () => {
      const allLogs = await base44.entities.ActivityLog.filter({
        entity_type: 'ElsterSubmission',
        entity_id: submissionId
      });
      return allLogs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    enabled: !!submissionId
  });

  const getEventIcon = (action) => {
    if (action.includes('CREATE')) return FileText;
    if (action.includes('UPDATE') || action.includes('EDIT')) return Edit;
    if (action.includes('VALIDATE')) return CheckCircle;
    if (action.includes('SUBMIT')) return Send;
    if (action.includes('ARCHIVE')) return Archive;
    return Eye;
  };

  const getEventColor = (action) => {
    if (action.includes('CREATE')) return 'text-blue-600';
    if (action.includes('UPDATE')) return 'text-purple-600';
    if (action.includes('VALIDATE')) return 'text-green-600';
    if (action.includes('SUBMIT')) return 'text-orange-600';
    if (action.includes('ARCHIVE')) return 'text-slate-600';
    return 'text-slate-500';
  };

  if (!submissionId) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-slate-500">Keine Submission ausgewählt</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Audit Trail</CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-center text-slate-500 py-4">Keine Aktivitäten</p>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {logs.map((log) => {
                const Icon = getEventIcon(log.action);
                return (
                  <div key={log.id} className="flex gap-3 p-3 border rounded-lg hover:bg-slate-50">
                    <Icon className={`w-5 h-5 mt-0.5 ${getEventColor(log.action)}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-medium text-sm">{log.details}</div>
                          <div className="text-xs text-slate-600 mt-1">
                            {log.user_email || 'System'}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs whitespace-nowrap">
                          {format(new Date(log.created_date), 'dd.MM. HH:mm', { locale: de })}
                        </Badge>
                      </div>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className="text-xs text-slate-500 mt-2 p-2 bg-slate-50 rounded">
                          {Object.entries(log.metadata)
                            .filter(([key]) => !['submission_id', 'event_type', 'timestamp'].includes(key))
                            .map(([key, value]) => (
                              <div key={key}>
                                {key}: {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              </div>
                            ))
                          }
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}