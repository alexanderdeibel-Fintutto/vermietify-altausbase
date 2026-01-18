import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import TimeAgo from '@/components/shared/TimeAgo';
import { VfBadge } from '@/components/shared/VfBadge';
import { History } from 'lucide-react';

export default function ActivityAuditLog() {
  const { data: logs = [] } = useQuery({
    queryKey: ['activity-logs'],
    queryFn: () => base44.entities.ActivityLog.list('-created_date', 50)
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Aktivitäts-Protokoll
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {logs.map((log) => (
            <div key={log.id} className="p-3 bg-[var(--theme-surface)] rounded-lg">
              <div className="flex items-start justify-between mb-1">
                <span className="text-sm font-medium">{log.user_email}</span>
                <TimeAgo date={log.created_date} className="text-xs" />
              </div>
              <div className="text-sm text-[var(--theme-text-secondary)]">
                {log.action} - {log.entity_type}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}