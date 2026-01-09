import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { Clock, Edit, Trash2, Plus } from 'lucide-react';

export default function AuditTrailPanel({ userId }) {
  const { data: activityLog = [] } = useQuery({
    queryKey: ['activityLog', userId],
    queryFn: async () => {
      return await base44.entities.ActivityLog.filter(
        { user_id: userId },
        '-created_date',
        50
      ) || [];
    }
  });

  const getActionIcon = (action) => {
    if (action.includes('created')) return <Plus className="w-4 h-4 text-green-600" />;
    if (action.includes('updated')) return <Edit className="w-4 h-4 text-blue-600" />;
    if (action.includes('deleted')) return <Trash2 className="w-4 h-4 text-red-600" />;
    return <Clock className="w-4 h-4 text-slate-400" />;
  };

  const getActionLabel = (action) => {
    const labels = {
      'asset_created': 'Asset erstellt',
      'asset_updated': 'Asset aktualisiert',
      'asset_deleted': 'Asset gelöscht',
      'csv_import_completed': 'CSV importiert',
      'tax_form_generated': 'Steuerformular erstellt'
    };
    return labels[action] || action;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Audit Trail (GDPR-konform)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activityLog.length === 0 ? (
            <p className="text-sm text-slate-500 font-light">Keine Aktivitäten vorhanden</p>
          ) : (
            activityLog.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="mt-1">
                  {getActionIcon(log.action)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{getActionLabel(log.action)}</span>
                    <Badge variant="outline" className="text-xs">{log.entity_type}</Badge>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {formatDistanceToNow(new Date(log.created_date), { addSuffix: true, locale: de })}
                  </p>
                  {log.details && (
                    <p className="text-xs text-slate-500 mt-1">
                      {typeof log.details === 'string' ? log.details : JSON.stringify(log.details).substring(0, 100)}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}