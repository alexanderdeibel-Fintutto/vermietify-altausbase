import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import TimeAgo from '@/components/shared/TimeAgo';
import { Activity } from 'lucide-react';

export default function ActivityAuditLog({ limit = 20 }) {
  const { data: logs = [] } = useQuery({
    queryKey: ['audit-logs', limit],
    queryFn: () => base44.entities.AuditLog.list('-created_date', limit)
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Aktivitätsprotokoll
        </CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-center text-sm text-[var(--theme-text-muted)] py-8">
            Keine Aktivitäten
          </p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {logs.map((log) => (
              <div 
                key={log.id}
                className="flex items-start gap-3 pb-3 border-b last:border-b-0"
              >
                <div className="w-2 h-2 rounded-full bg-[var(--vf-primary-500)] mt-2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm">{log.action}</div>
                  <div className="text-xs text-[var(--theme-text-muted)] mt-1">
                    {log.created_by} · <TimeAgo date={log.created_date} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}