import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

const ACTION_ICONS = {
  login: '🔓',
  logout: '🔒',
  data_access: '👁️',
  data_export: '⬇️',
  data_modification: '✏️',
  data_deletion: '🗑️',
  role_assignment: '👤',
  settings_change: '⚙️'
};

export default function UserAuditLogViewer() {
  const [filter, setFilter] = useState('');

  const { data: logs, isLoading } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: async () => {
      try {
        return await base44.entities.UserAuditLog.list('-timestamp', 100);
      } catch {
        return [];
      }
    }
  });

  const filtered = logs?.filter(log =>
    log.user_email?.includes(filter) ||
    log.action?.includes(filter) ||
    log.resource_type?.includes(filter)
  ) || [];

  return (
    <div className="space-y-4">
      <div>
        <Input
          placeholder="Nach Email, Aktion oder Ressource filtern..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-md"
        />
      </div>

      {isLoading ? (
        <Loader2 className="w-6 h-6 animate-spin" />
      ) : filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map(log => (
            <Card key={log.id}>
              <CardContent className="pt-3">
                <div className="grid grid-cols-5 gap-3 text-xs">
                  <div>
                    <p className="text-slate-600">Benutzer</p>
                    <p className="font-semibold">{log.user_email}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Aktion</p>
                    <p className="font-semibold">
                      {ACTION_ICONS[log.action]} {log.action}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600">Ressource</p>
                    <p className="font-semibold">{log.resource_type}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Status</p>
                    <Badge
                      className={
                        log.status === 'success'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }
                    >
                      {log.status}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-600">Zeit</p>
                    <p className="font-semibold">
                      {new Date(log.timestamp).toLocaleDateString('de-DE', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-600">Keine Logs vorhanden</p>
      )}
    </div>
  );
}