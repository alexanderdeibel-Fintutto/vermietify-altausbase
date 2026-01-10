import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';

export default function RecentActivityWidget({ executions }) {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'running':
        return <Clock className="w-4 h-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      completed: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
      running: 'bg-blue-100 text-blue-700',
      cancelled: 'bg-slate-100 text-slate-700'
    };
    return variants[status] || variants.cancelled;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Aktuelle Aktivität</CardTitle>
      </CardHeader>
      <CardContent>
        {executions.length === 0 ? (
          <p className="text-sm text-slate-500">Keine Ausführungen</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {executions.map((execution) => (
              <div key={execution.id} className="p-3 border rounded-lg hover:bg-slate-50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-3 flex-1">
                    {getStatusIcon(execution.status)}
                    <div className="flex-1">
                      <p className="font-medium text-sm">{execution.workflow_id}</p>
                      <p className="text-xs text-slate-600">
                        Gestartet: {format(new Date(execution.started_at), 'Pp', { locale: de })}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusBadge(execution.status)}>
                    {execution.status}
                  </Badge>
                </div>

                <div className="flex justify-between text-xs text-slate-600">
                  <span>Von: {execution.started_by}</span>
                  <span>
                    {execution.execution_time_seconds
                      ? `${execution.execution_time_seconds}s`
                      : 'läuft...'}
                  </span>
                </div>

                {execution.error_message && (
                  <p className="text-xs text-red-600 mt-2 bg-red-50 p-2 rounded">
                    {execution.error_message}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}