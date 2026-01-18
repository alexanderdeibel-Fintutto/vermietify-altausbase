import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import TimeAgo from '@/components/shared/TimeAgo';
import StatusBadge from '@/components/shared/StatusBadge';
import { FileText } from 'lucide-react';

export default function AuditLogViewer() {
  const { data: logs = [] } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => base44.entities.AuditLog.list('-created_date', 100)
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Audit-Protokoll
          <span className="vf-badge vf-badge-primary">{logs.length}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="vf-table-container">
          <table className="vf-table vf-table-compact">
            <thead>
              <tr>
                <th>Benutzer</th>
                <th>Aktion</th>
                <th>Entität</th>
                <th>Zeitpunkt</th>
              </tr>
            </thead>
            <tbody>
              {logs.slice(0, 20).map((log) => (
                <tr key={log.id}>
                  <td>{log.user_email}</td>
                  <td><StatusBadge status={log.action} /></td>
                  <td className="text-sm text-[var(--theme-text-muted)]">{log.entity_type}</td>
                  <td><TimeAgo date={log.created_date} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}