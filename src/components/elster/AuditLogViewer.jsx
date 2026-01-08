import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, User, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function AuditLogViewer({ submissionId }) {
  const { data: logs = [] } = useQuery({
    queryKey: ['audit-logs', submissionId],
    queryFn: async () => {
      const activities = await base44.entities.ActivityLog.filter({
        entity_type: 'ElsterSubmission',
        entity_id: submissionId
      });
      return activities.sort((a, b) => 
        new Date(b.created_date).getTime() - new Date(a.created_date).getTime()
      );
    },
    enabled: !!submissionId
  });

  if (logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Audit-Trail
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 text-center py-4">Keine Aktivitäten</p>
        </CardContent>
      </Card>
    );
  }

  const getActionColor = (action) => {
    switch (action) {
      case 'created': return 'bg-blue-100 text-blue-800';
      case 'updated': return 'bg-yellow-100 text-yellow-800';
      case 'validated': return 'bg-green-100 text-green-800';
      case 'submitted': return 'bg-purple-100 text-purple-800';
      case 'archived': return 'bg-slate-100 text-slate-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getActionLabel = (action) => {
    const labels = {
      created: 'Erstellt',
      updated: 'Bearbeitet',
      validated: 'Validiert',
      submitted: 'Eingereicht',
      archived: 'Archiviert',
      exported: 'Exportiert'
    };
    return labels[action] || action;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Audit-Trail ({logs.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {logs.map((log, idx) => (
            <div key={log.id || idx} className="flex gap-3 pb-3 border-b last:border-0">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                <User className="w-4 h-4 text-slate-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={getActionColor(log.action)}>
                    {getActionLabel(log.action)}
                  </Badge>
                  <span className="text-xs text-slate-500">
                    {log.created_by || 'System'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Clock className="w-3 h-3" />
                  {new Date(log.created_date).toLocaleString('de-DE')}
                </div>
                {log.metadata?.notes && (
                  <p className="text-xs text-slate-600 mt-1">{log.metadata.notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}