import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';

const STATUS_CONFIG = {
  open: { label: 'Offen', color: 'bg-red-100 text-red-800', icon: AlertCircle },
  acknowledged: { label: 'Bestätigt', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  in_progress: { label: 'In Bearbeitung', color: 'bg-blue-100 text-blue-800', icon: Clock },
  resolved: { label: 'Gelöst', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  closed: { label: 'Geschlossen', color: 'bg-slate-100 text-slate-800', icon: CheckCircle }
};

export default function TenantIssuesCard({ tenantId }) {
  const { data: issues = [] } = useQuery({
    queryKey: ['tenant-issues', tenantId],
    queryFn: () => base44.entities.TenantIssueReport.filter({ tenant_id: tenantId }, '-created_date'),
    enabled: !!tenantId
  });

  const openIssues = issues.filter(i => ['open', 'acknowledged', 'in_progress'].includes(i.status));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Störungsmeldungen</span>
          <Badge variant="outline">{issues.length} gesamt</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {issues.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">Keine Störungsmeldungen</p>
        ) : (
          <div className="space-y-3">
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2 pb-3 border-b">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{openIssues.length}</p>
                <p className="text-xs text-slate-600">Offen</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {issues.filter(i => i.status === 'resolved').length}
                </p>
                <p className="text-xs text-slate-600">Gelöst</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-600">{issues.length}</p>
                <p className="text-xs text-slate-600">Gesamt</p>
              </div>
            </div>

            {/* Recent Issues */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-700">Letzte Meldungen</p>
              {issues.slice(0, 5).map((issue) => {
                const config = STATUS_CONFIG[issue.status] || STATUS_CONFIG.open;
                const Icon = config.icon;
                
                return (
                  <div key={issue.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50">
                    <Icon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{issue.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={config.color + ' text-xs'}>{config.label}</Badge>
                        <span className="text-xs text-slate-500">
                          {new Date(issue.created_date).toLocaleDateString('de-DE')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}