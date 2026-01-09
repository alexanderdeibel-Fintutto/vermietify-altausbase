import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function OutstandingTasksWidget({ tenantId }) {
  const { data: locks = [] } = useQuery({
    queryKey: ['tenantLocks', tenantId],
    queryFn: () => base44.entities.TenantAdministrationLock.filter({ 
      tenant_id: tenantId,
      is_visible_to_tenant: true
    }, '-due_date', 10)
  });

  const pendingLocks = locks.filter(l => l.status === 'pending');
  const overdueLocks = pendingLocks.filter(l => new Date(l.due_date) < new Date());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CheckSquare className="w-5 h-5" />
          Offene Aufgaben
          {pendingLocks.length > 0 && (
            <Badge className="bg-amber-100 text-amber-800">{pendingLocks.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {overdueLocks.length > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <p className="text-sm font-semibold text-red-900">{overdueLocks.length} überfällige Aufgabe(n)</p>
            </div>
          </div>
        )}

        {pendingLocks.length === 0 ? (
          <p className="text-sm text-slate-600">Keine offenen Aufgaben</p>
        ) : (
          pendingLocks.slice(0, 3).map(lock => (
            <div key={lock.id} className="p-3 border border-slate-200 rounded-lg">
              <p className="text-sm font-semibold text-slate-900 mb-1">{lock.title}</p>
              <p className="text-xs text-slate-600 mb-2">{lock.description}</p>
              <div className="flex items-center gap-2">
                <Badge className={
                  new Date(lock.due_date) < new Date() 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-blue-100 text-blue-800'
                }>
                  Fällig: {new Date(lock.due_date).toLocaleDateString('de-DE')}
                </Badge>
                <Badge className="bg-amber-100 text-amber-800">{lock.priority}</Badge>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}