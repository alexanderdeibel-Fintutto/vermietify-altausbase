import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Activity, Edit3, Trash2, Plus } from 'lucide-react';

const ACTION_COLORS = {
  CREATE: 'bg-emerald-100 text-emerald-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800'
};

const ACTION_ICONS = {
  CREATE: <Plus className="w-4 h-4" />,
  UPDATE: <Edit3 className="w-4 h-4" />,
  DELETE: <Trash2 className="w-4 h-4" />
};

export default function AuditLogViewer() {
  const [entityFilter, setEntityFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs', entityFilter, actionFilter],
    queryFn: async () => {
      // Mock: Fetch audit logs
      return [
        {
          id: '1',
          timestamp: new Date(Date.now() - 300000),
          user: 'max@example.com',
          action: 'UPDATE',
          entity: 'Invoice',
          entityId: 'inv_123',
          change: 'Status: pending → paid',
          ipAddress: '192.168.1.1'
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 600000),
          user: 'sara@example.com',
          action: 'CREATE',
          entity: 'Building',
          entityId: 'bld_456',
          change: 'Name: "Neue Villa"',
          ipAddress: '192.168.1.2'
        }
      ];
    }
  });

  const filteredLogs = logs.filter(log => {
    if (entityFilter !== 'all' && log.entity !== entityFilter) return false;
    if (actionFilter !== 'all' && log.action !== actionFilter) return false;
    return true;
  });

  const entities = [...new Set(logs.map(l => l.entity))];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Audit-Log
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-2 gap-2">
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Entitäten</SelectItem>
              {entities.map(e => (
                <SelectItem key={e} value={e}>{e}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Aktionen</SelectItem>
              <SelectItem value="CREATE">Erstellt</SelectItem>
              <SelectItem value="UPDATE">Aktualisiert</SelectItem>
              <SelectItem value="DELETE">Gelöscht</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Logs */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {isLoading ? (
            <p className="text-sm text-slate-500">Laden...</p>
          ) : filteredLogs.length === 0 ? (
            <p className="text-sm text-slate-500">Keine Einträge</p>
          ) : (
            filteredLogs.map(log => (
              <div
                key={log.id}
                className="p-3 border rounded-lg hover:bg-slate-50 text-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 flex-1">
                    <Badge className={ACTION_COLORS[log.action]}>
                      {ACTION_ICONS[log.action]}
                    </Badge>
                    <div className="flex-1">
                      <p className="font-medium">
                        {log.entity} • <span className="text-xs text-slate-500">{log.entityId}</span>
                      </p>
                      <p className="text-slate-600">{log.change}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {log.user} • {new Date(log.timestamp).toLocaleString('de')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}