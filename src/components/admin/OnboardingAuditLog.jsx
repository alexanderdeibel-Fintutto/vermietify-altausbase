import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { History, CheckCircle, XCircle, UserPlus, Edit, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function OnboardingAuditLog({ tenantId }) {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['onboardingAudit', tenantId],
    queryFn: () => base44.entities.OnboardingAuditLog.filter({ tenant_id: tenantId }, '-created_at', 100),
    refetchInterval: 10000
  });

  const filteredLogs = auditLogs.filter(log => 
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.performed_by.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.details?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getActionIcon = (action) => {
    const icons = {
      approved: CheckCircle,
      rejected: XCircle,
      assigned: UserPlus,
      updated: Edit,
      created: Clock
    };
    return icons[action] || Clock;
  };

  const getActionColor = (action) => {
    const colors = {
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      assigned: 'bg-blue-100 text-blue-800',
      updated: 'bg-amber-100 text-amber-800',
      created: 'bg-slate-100 text-slate-800'
    };
    return colors[action] || 'bg-slate-100 text-slate-800';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Audit-Log
          </CardTitle>
          <Input
            placeholder="Suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <p className="text-sm text-slate-600 text-center py-4">Keine Einträge gefunden</p>
          ) : (
            filteredLogs.map(log => {
              const Icon = getActionIcon(log.action);
              return (
                <div key={log.id} className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-slate-600" />
                      <Badge className={getActionColor(log.action)}>
                        {log.action}
                      </Badge>
                    </div>
                    <span className="text-xs text-slate-500">
                      {new Date(log.created_at).toLocaleString('de-DE')}
                    </span>
                  </div>
                  <div className="ml-6">
                    <p className="text-sm font-semibold text-slate-900">{log.lock_title}</p>
                    <p className="text-xs text-slate-600 mt-1">
                      von <span className="font-semibold">{log.performed_by}</span>
                    </p>
                    {log.details && (
                      <p className="text-xs text-slate-700 mt-2 p-2 bg-slate-50 rounded">
                        {log.details}
                      </p>
                    )}
                    {log.notes && (
                      <p className="text-xs text-slate-600 mt-2 italic">
                        Notiz: {log.notes}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}