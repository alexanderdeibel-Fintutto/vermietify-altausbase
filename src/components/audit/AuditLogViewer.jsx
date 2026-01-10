import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Search, Filter } from 'lucide-react';

export default function AuditLogViewer({ companyId }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterEntity, setFilterEntity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs', companyId],
    queryFn: async () => {
      const result = await base44.asServiceRole.entities.AuditLog.filter({
        company_id: companyId
      });
      return result.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    }
  });

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      !searchQuery ||
      log.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity_id?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction = filterAction === 'all' || log.action_type === filterAction;
    const matchesEntity = filterEntity === 'all' || log.entity_type === filterEntity;
    const matchesStatus = filterStatus === 'all' || log.status === filterStatus;

    return matchesSearch && matchesAction && matchesEntity && matchesStatus;
  });

  const getActionBadgeColor = (action) => {
    if (action.includes('created')) return 'bg-green-100 text-green-700';
    if (action.includes('updated')) return 'bg-blue-100 text-blue-700';
    if (action.includes('deleted')) return 'bg-red-100 text-red-700';
    if (action.includes('assigned')) return 'bg-purple-100 text-purple-700';
    if (action.includes('approved')) return 'bg-emerald-100 text-emerald-700';
    if (action.includes('rejected')) return 'bg-orange-100 text-orange-700';
    return 'bg-slate-100 text-slate-700';
  };

  const getEntityBadgeColor = (entity) => {
    switch (entity) {
      case 'document':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'task':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'workflow':
        return 'bg-pink-50 text-pink-700 border-pink-200';
      case 'role':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'approval':
        return 'bg-green-50 text-green-700 border-green-200';
      default:
        return 'bg-slate-50 text-slate-700';
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Nach Beschreibung, Benutzer oder Entity-ID suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700">Aktionstyp</label>
                <Select value={filterAction} onValueChange={setFilterAction}>
                  <SelectTrigger className="mt-1 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Aktionen</SelectItem>
                    <SelectItem value="document_created">Dokument erstellt</SelectItem>
                    <SelectItem value="document_updated">Dokument aktualisiert</SelectItem>
                    <SelectItem value="document_deleted">Dokument gelöscht</SelectItem>
                    <SelectItem value="task_created">Aufgabe erstellt</SelectItem>
                    <SelectItem value="task_assigned">Aufgabe zugewiesen</SelectItem>
                    <SelectItem value="role_assigned">Rolle zugewiesen</SelectItem>
                    <SelectItem value="workflow_executed">Workflow ausgeführt</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">Entity-Typ</label>
                <Select value={filterEntity} onValueChange={setFilterEntity}>
                  <SelectTrigger className="mt-1 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Typen</SelectItem>
                    <SelectItem value="document">Dokument</SelectItem>
                    <SelectItem value="task">Aufgabe</SelectItem>
                    <SelectItem value="workflow">Workflow</SelectItem>
                    <SelectItem value="role">Rolle</SelectItem>
                    <SelectItem value="approval">Genehmigung</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">Status</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="mt-1 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle</SelectItem>
                    <SelectItem value="success">Erfolgreich</SelectItem>
                    <SelectItem value="failed">Fehlgeschlagen</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <p className="text-xs text-slate-600">
                  {filteredLogs.length} von {logs.length} Einträgen
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-slate-200 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredLogs.length === 0 ? (
          <Card className="bg-slate-50">
            <CardContent className="pt-6 text-center text-slate-500">
              Keine Audit-Einträge gefunden
            </CardContent>
          </Card>
        ) : (
          filteredLogs.map(log => (
            <Card key={log.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getActionBadgeColor(log.action_type)} variant="secondary">
                        {log.action_type}
                      </Badge>
                      <Badge variant="outline" className={`${getEntityBadgeColor(log.entity_type)} border`}>
                        {log.entity_type}
                      </Badge>
                      {log.status === 'failed' && (
                        <Badge variant="destructive" className="text-xs">
                          Fehler
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-slate-900 font-medium mb-1">{log.description}</p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      <span>Von: {log.user_email}</span>
                      <span>•</span>
                      <span>Entity-ID: {log.entity_id}</span>
                      <span>•</span>
                      <span>{format(new Date(log.created_date), 'dd.MM.yyyy HH:mm:ss', { locale: de })}</span>
                    </div>

                    {/* Changes */}
                    {log.old_values && log.new_values && (
                      <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-2 rounded">
                        <p className="font-medium">Änderungen:</p>
                        {Object.keys(log.new_values).map(key => (
                          log.old_values[key] !== log.new_values[key] && (
                            <p key={key}>
                              {key}: {log.old_values[key]} → {log.new_values[key]}
                            </p>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}