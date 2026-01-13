import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { History, Filter } from 'lucide-react';

const ENTITY_TYPES = ['PRODUCT', 'FEATURE', 'TIER', 'BUNDLE', 'DISCOUNT', 'TRIGGER'];
const ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'ACTIVATE', 'DEACTIVATE'];

export default function AdminPricingAuditLog() {
  const [filterEntity, setFilterEntity] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterUser, setFilterUser] = useState('');

  const { data: logs = [] } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: () => base44.entities.PricingAuditLog.list('-created_date', 1000)
  });

  const filteredLogs = logs.filter(log => {
    const data = log.data;
    if (filterEntity && data.entity_type !== filterEntity) return false;
    if (filterAction && data.action !== filterAction) return false;
    if (filterUser && !data.changed_by.includes(filterUser)) return false;
    return true;
  });

  const getActionColor = (action) => {
    switch (action) {
      case 'CREATE': return 'bg-green-100 text-green-800';
      case 'UPDATE': return 'bg-blue-100 text-blue-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      case 'ACTIVATE': return 'bg-emerald-100 text-emerald-800';
      case 'DEACTIVATE': return 'bg-amber-100 text-amber-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-light text-slate-900">Audit-Log</h1>
        <p className="text-slate-600 mt-1">Änderungsprotokoll aller Pricing-Konfigurationen</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-600">Entity-Typ</label>
              <Select value={filterEntity} onValueChange={setFilterEntity}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Alle</SelectItem>
                  {ENTITY_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-600">Aktion</label>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Alle</SelectItem>
                  {ACTIONS.map(action => <SelectItem key={action} value={action}>{action}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-600">Benutzer</label>
              <Input value={filterUser} onChange={(e) => setFilterUser(e.target.value)} placeholder="E-Mail Filter..." />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {filteredLogs.map(log => (
          <Card key={log.id}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <History className="w-4 h-4 text-slate-400" />
                    <Badge className={getActionColor(log.data.action)}>{log.data.action}</Badge>
                    <Badge variant="secondary">{log.data.entity_type}</Badge>
                  </div>
                  <p className="text-sm text-slate-600">
                    <span className="font-medium">{log.data.changed_by}</span> hat {log.data.entity_type.toLowerCase()} geändert
                  </p>
                  {log.data.field_name && (
                    <p className="text-xs text-slate-500 mt-1">
                      Feld: <span className="font-mono">{log.data.field_name}</span>
                    </p>
                  )}
                  {log.data.reason && (
                    <p className="text-xs text-slate-600 mt-1">Grund: {log.data.reason}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-2">
                    {new Date(log.created_date).toLocaleString('de-DE')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}