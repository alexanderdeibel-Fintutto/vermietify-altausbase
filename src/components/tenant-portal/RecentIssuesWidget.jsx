import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AlertCircle, Activity } from 'lucide-react';

const statusColors = {
  open: 'bg-yellow-100 text-yellow-800',
  acknowledged: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-orange-100 text-orange-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-slate-100 text-slate-800'
};

const statusLabels = {
  open: 'Offen',
  acknowledged: 'Bestätigt',
  in_progress: 'In Bearbeitung',
  resolved: 'Gelöst',
  closed: 'Geschlossen'
};

export default function RecentIssuesWidget({ tenantId }) {
  const { data: issues = [] } = useQuery({
    queryKey: ['tenant-recent-issues', tenantId],
    queryFn: async () => {
      const allIssues = await base44.entities.TenantIssueReport.filter({ 
        tenant_id: tenantId 
      }, '-created_date', 5);
      return allIssues;
    },
    enabled: !!tenantId
  });

  const openIssues = issues.filter(i => i.status !== 'resolved' && i.status !== 'closed');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Meine Störungsmeldungen
        </CardTitle>
      </CardHeader>
      <CardContent>
        {issues.length === 0 ? (
          <div className="text-center py-6">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-600">Keine Störungsmeldungen</p>
          </div>
        ) : (
          <div className="space-y-2">
            {openIssues.length > 0 && (
              <div className="p-2 bg-orange-50 rounded border border-orange-200 mb-3">
                <p className="text-xs font-semibold text-orange-900">
                  {openIssues.length} offene Meldung{openIssues.length !== 1 ? 'en' : ''}
                </p>
              </div>
            )}

            {issues.map(issue => (
              <div key={issue.id} className="border rounded p-3 hover:bg-slate-50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{issue.title}</p>
                    <p className="text-xs text-slate-600 mt-1">
                      {new Date(issue.created_date).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                  <Badge className={statusColors[issue.status]}>
                    {statusLabels[issue.status]}
                  </Badge>
                </div>
                {issue.related_sensor_id && (
                  <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    <Activity className="w-3 h-3" />
                    Sensor-Daten verfügbar
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}