import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ChevronDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function AuditLogViewer() {
  const [filterAction, setFilterAction] = useState('');
  const [filterEntity, setFilterEntity] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const { data: logs = [] } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => base44.entities.AuditLog?.list?.('-timestamp', 100) || []
  });

  const filtered = logs.filter(log => {
    if (filterAction && log.action !== filterAction) return false;
    if (filterEntity && log.entity_type !== filterEntity) return false;
    if (searchUser && !log.user_email.includes(searchUser)) return false;
    return true;
  });

  const getActionColor = (action) => {
    if (action === 'CREATE') return 'bg-green-100 text-green-800';
    if (action === 'DELETE') return 'bg-red-100 text-red-800';
    if (action === 'UPDATE') return 'bg-blue-100 text-blue-800';
    return 'bg-slate-100 text-slate-800';
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-3 gap-2">
        <Input
          placeholder="User suchen..."
          value={searchUser}
          onChange={(e) => setSearchUser(e.target.value)}
        />
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger>
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>Alle</SelectItem>
            <SelectItem value="CREATE">Create</SelectItem>
            <SelectItem value="UPDATE">Update</SelectItem>
            <SelectItem value="DELETE">Delete</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterEntity} onValueChange={setFilterEntity}>
          <SelectTrigger>
            <SelectValue placeholder="Entity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>Alle</SelectItem>
            <SelectItem value="Invoice">Rechnung</SelectItem>
            <SelectItem value="Contract">Vertrag</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Logs */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-sm text-slate-500">Keine Einträge</p>
        ) : (
          filtered.map(log => (
            <Card key={log.id} className="cursor-pointer" onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge className={getActionColor(log.action)}>{log.action}</Badge>
                      <span className="text-sm font-medium">{log.entity_type}</span>
                      <span className="text-xs text-slate-500">{log.entity_id}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{log.user_email} • {new Date(log.timestamp).toLocaleString('de-DE')}</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${expandedId === log.id ? 'rotate-180' : ''}`} />
                </div>

                {expandedId === log.id && (
                  <div className="mt-3 pt-3 border-t space-y-2 text-xs">
                    <p><strong>Change:</strong> {log.change_summary}</p>
                    {log.reason && <p><strong>Reason:</strong> {log.reason}</p>}
                    {log.ip_address && <p><strong>IP:</strong> {log.ip_address}</p>}
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