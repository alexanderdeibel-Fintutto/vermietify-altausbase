import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Search } from 'lucide-react';

export default function PermissionAuditViewer({ companyId }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState('all');

  const { data: logs = [] } = useQuery({
    queryKey: ['permission-audit-logs', companyId],
    queryFn: async () => {
      const result = await base44.asServiceRole.entities.PermissionAuditLog.filter({
        company_id: companyId
      });
      return result.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    }
  });

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      !searchQuery ||
      log.role_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.changed_by?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction = filterAction === 'all' || log.action_type === filterAction;

    return matchesSearch && matchesAction;
  });

  const getActionBadge = (action) => {
    switch (action) {
      case 'role_created':
        return <Badge className="bg-green-100 text-green-700">Rolle erstellt</Badge>;
      case 'role_updated':
        return <Badge className="bg-blue-100 text-blue-700">Rolle aktualisiert</Badge>;
      case 'role_deleted':
        return <Badge className="bg-red-100 text-red-700">Rolle gelöscht</Badge>;
      case 'role_assigned':
        return <Badge className="bg-purple-100 text-purple-700">Rolle zugewiesen</Badge>;
      case 'role_revoked':
        return <Badge className="bg-orange-100 text-orange-700">Rolle entzogen</Badge>;
      default:
        return <Badge>{action}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Nach Rolle, Benutzer oder Admin suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Aktionen</SelectItem>
                <SelectItem value="role_created">Rolle erstellt</SelectItem>
                <SelectItem value="role_updated">Rolle aktualisiert</SelectItem>
                <SelectItem value="role_assigned">Rolle zugewiesen</SelectItem>
                <SelectItem value="role_revoked">Rolle entzogen</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-xs text-slate-600 flex items-center">
              {filteredLogs.length} von {logs.length} Einträgen
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs */}
      <div className="space-y-2">
        {filteredLogs.length === 0 ? (
          <Card className="bg-slate-50">
            <CardContent className="pt-6 text-center text-slate-500">
              Keine Einträge gefunden
            </CardContent>
          </Card>
        ) : (
          filteredLogs.map(log => (
            <Card key={log.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    {getActionBadge(log.action_type)}
                  </div>
                  <span className="text-xs text-slate-500">
                    {format(new Date(log.created_date), 'dd.MM.yyyy HH:mm:ss', { locale: de })}
                  </span>
                </div>

                <div className="text-sm text-slate-900 mb-2">
                  <p>
                    <span className="font-medium">Rolle:</span> {log.role_name}
                  </p>
                  {log.user_email && (
                    <p>
                      <span className="font-medium">Benutzer:</span> {log.user_email}
                    </p>
                  )}
                  <p>
                    <span className="font-medium">Geändert von:</span> {log.changed_by}
                  </p>
                  {log.reason && (
                    <p>
                      <span className="font-medium">Grund:</span> {log.reason}
                    </p>
                  )}
                </div>

                {/* Changed Fields */}
                {log.changed_fields?.length > 0 && (
                  <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded">
                    <p className="font-medium mb-1">Geänderte Berechtigungen:</p>
                    <div className="flex flex-wrap gap-1">
                      {log.changed_fields.map(field => (
                        <Badge key={field} variant="outline" className="text-xs">
                          {field}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}