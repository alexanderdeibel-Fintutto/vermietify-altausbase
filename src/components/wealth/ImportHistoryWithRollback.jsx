import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, RotateCcw, CheckCircle2 } from 'lucide-react';

export default function ImportHistoryWithRollback() {
  const [expandedBatch, setExpandedBatch] = useState(null);
  const queryClient = useQueryClient();

  const { data: batches = [], isLoading } = useQuery({
    queryKey: ['importBatches'],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (!user) return [];
      return base44.entities.ImportBatchLog.filter(
        { user_id: user.id },
        '-import_date',
        50
      );
    }
  });

  const rollbackMutation = useMutation({
    mutationFn: async (batchId) => {
      const response = await base44.functions.invoke('rollbackImportBatch', { batch_id: batchId });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['importBatches'] });
      queryClient.invalidateQueries({ queryKey: ['assetPortfolio'] });
    }
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'rolled_back':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      completed: 'Erfolgreich',
      failed: 'Fehler',
      rolled_back: 'Zurückgerollt'
    };
    return labels[status] || status;
  };

  if (isLoading) {
    return <p className="text-sm font-light text-slate-500">Lädt...</p>;
  }

  if (batches.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm font-light text-slate-500">Keine Import-Historie vorhanden</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-light">Import-Historie</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {batches.map((batch) => (
            <div
              key={batch.id}
              className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-light text-slate-900">
                      {batch.broker_source}
                    </p>
                    <Badge className={getStatusColor(batch.status)}>
                      {getStatusLabel(batch.status)}
                    </Badge>
                  </div>
                  <p className="text-xs font-light text-slate-600">
                    {new Date(batch.import_date).toLocaleString('de-DE')}
                  </p>
                  <div className="flex gap-4 mt-2 text-xs font-light text-slate-600">
                    <span>✓ {batch.success_count} erfolgreich</span>
                    {batch.error_count > 0 && <span className="text-red-600">✗ {batch.error_count} Fehler</span>}
                    {batch.warning_count > 0 && <span className="text-yellow-600">⚠ {batch.warning_count} Warnungen</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setExpandedBatch(expandedBatch === batch.id ? null : batch.id)}
                    className="text-xs font-light"
                  >
                    {expandedBatch === batch.id ? 'Ausklappen' : 'Details'}
                  </Button>
                  {batch.status === 'completed' && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => rollbackMutation.mutate(batch.batch_id)}
                      disabled={rollbackMutation.isPending}
                      className="text-xs font-light gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Zurückrollen
                    </Button>
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedBatch === batch.id && batch.error_log && batch.error_log.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200 space-y-2">
                  <p className="text-xs font-light text-slate-600 font-medium">Fehlerdetails:</p>
                  {batch.error_log.slice(0, 5).map((error, idx) => (
                    <div
                      key={idx}
                      className={`text-xs font-light p-2 rounded flex items-start gap-2 ${
                        error.severity === 'warning'
                          ? 'bg-yellow-50 text-yellow-800'
                          : 'bg-red-50 text-red-800'
                      }`}
                    >
                      {error.severity === 'warning' ? '⚠' : '✗'}
                      <span>Zeile {error.row}: {error.message}</span>
                    </div>
                  ))}
                  {batch.error_log.length > 5 && (
                    <p className="text-xs font-light text-slate-600">
                      + {batch.error_log.length - 5} weitere Fehler
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}