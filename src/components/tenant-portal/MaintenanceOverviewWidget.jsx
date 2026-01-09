import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Wrench, Clock, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

export default function MaintenanceOverviewWidget({ tenantId }) {
  const { data: maintenanceRequests = [] } = useQuery({
    queryKey: ['tenantMaintenance', tenantId],
    queryFn: () => base44.entities.MaintenanceTask.filter({ tenant_id: tenantId }, '-created_at', 20),
    enabled: !!tenantId
  });

  const recentRequests = maintenanceRequests.slice(0, 4);
  const pendingCount = maintenanceRequests.filter(m => m.status === 'pending').length;
  const inProgressCount = maintenanceRequests.filter(m => m.status === 'in_progress').length;
  const completedCount = maintenanceRequests.filter(m => m.status === 'completed').length;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-3 h-3 text-amber-600" />;
      case 'in_progress': return <Loader2 className="w-3 h-3 text-blue-600 animate-spin" />;
      case 'completed': return <CheckCircle className="w-3 h-3 text-green-600" />;
      default: return <AlertTriangle className="w-3 h-3 text-red-600" />;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-amber-100 text-amber-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-slate-100 text-slate-800'
    };
    const labels = {
      pending: 'Ausstehend',
      in_progress: 'In Bearbeitung',
      completed: 'Abgeschlossen',
      cancelled: 'Abgebrochen'
    };
    return <Badge className={styles[status] || styles.pending}>{labels[status] || status}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Wrench className="w-4 h-4" />
          Wartungsanfragen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Summary */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 bg-amber-50 border border-amber-200 rounded text-center">
            <p className="text-lg font-bold text-amber-900">{pendingCount}</p>
            <p className="text-xs text-amber-700">Offen</p>
          </div>
          <div className="p-2 bg-blue-50 border border-blue-200 rounded text-center">
            <p className="text-lg font-bold text-blue-900">{inProgressCount}</p>
            <p className="text-xs text-blue-700">Laufend</p>
          </div>
          <div className="p-2 bg-green-50 border border-green-200 rounded text-center">
            <p className="text-lg font-bold text-green-900">{completedCount}</p>
            <p className="text-xs text-green-700">Erledigt</p>
          </div>
        </div>

        {/* Recent Requests */}
        <div className="pt-3 border-t">
          <p className="text-xs font-medium text-slate-700 mb-3">Aktuelle Anfragen</p>
          {recentRequests.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">Keine Wartungsanfragen</p>
          ) : (
            <div className="space-y-2">
              {recentRequests.map(request => (
                <div key={request.id} className="p-2 border border-slate-200 rounded hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2 flex-1">
                      {getStatusIcon(request.status)}
                      <p className="text-xs font-medium text-slate-900 line-clamp-1">{request.title}</p>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-1 ml-5">{request.description}</p>
                  <div className="flex items-center justify-between mt-1 ml-5">
                    <p className="text-xs text-slate-500">
                      {new Date(request.created_at).toLocaleDateString('de-DE')}
                    </p>
                    {request.priority && (
                      <Badge variant="outline" className="text-xs h-4">
                        {request.priority === 'urgent' ? '🔴 Dringend' : 
                         request.priority === 'high' ? '🟠 Hoch' : 
                         request.priority === 'medium' ? '🟡 Mittel' : '🟢 Niedrig'}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}