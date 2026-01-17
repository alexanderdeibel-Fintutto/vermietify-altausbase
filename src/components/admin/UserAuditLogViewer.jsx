import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import TimeAgo from '@/components/shared/TimeAgo';
import { FileText } from 'lucide-react';

export default function UserAuditLogViewer({ userId, limit = 20 }) {
  const { data: logs = [] } = useQuery({
    queryKey: ['audit-logs', userId],
    queryFn: async () => {
      const allLogs = await base44.entities.AuditLog.list('-created_date', limit);
      return userId ? allLogs.filter(l => l.user_id === userId) : allLogs;
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Aktivitätsprotokoll
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 p-3 bg-[var(--theme-surface)] rounded-lg">
              <div className="flex-1">
                <div className="font-medium text-sm">{log.action}</div>
                <div className="text-xs text-[var(--theme-text-muted)] mt-1">{log.details}</div>
              </div>
              <TimeAgo date={log.created_date} className="text-xs text-[var(--theme-text-muted)]" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}