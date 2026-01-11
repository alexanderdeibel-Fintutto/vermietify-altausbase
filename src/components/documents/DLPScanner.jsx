import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, Scan, Loader2 } from 'lucide-react';

export default function DLPScanner({ documentId, companyId }) {
  const queryClient = useQueryClient();

  const { data: violations = [] } = useQuery({
    queryKey: ['dlp-violations', documentId],
    queryFn: async () => {
      const result = await base44.asServiceRole.entities.DLPViolation.filter({
        document_id: documentId
      });
      return result;
    }
  });

  const scanMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('scanDocumentDLP', {
        document_id: documentId,
        company_id: companyId
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dlp-violations'] });
    }
  });

  const resolveMutation = useMutation({
    mutationFn: (violationId) =>
      base44.asServiceRole.entities.DLPViolation.update(violationId, {
        resolved: true,
        resolved_by: 'user'
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dlp-violations'] })
  });

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  const scanResult = scanMutation.data?.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" />
          DLP Scanner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          onClick={() => scanMutation.mutate()}
          disabled={scanMutation.isPending}
          className="w-full gap-2"
        >
          {scanMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Scannt...
            </>
          ) : (
            <>
              <Scan className="w-4 h-4" />
              Scan starten
            </>
          )}
        </Button>

        {scanResult && (
          <div className={`p-3 rounded ${scanResult.violations_count > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
            <p className="text-sm font-medium">
              {scanResult.violations_count} Verstöße gefunden
            </p>
          </div>
        )}

        {/* Violations */}
        <div className="space-y-2">
          {violations.map(violation => (
            <div key={violation.id} className="p-2 border rounded">
              <div className="flex items-center justify-between mb-2">
                <Badge className={getSeverityColor(violation.severity)}>
                  {violation.severity}
                </Badge>
                {!violation.resolved && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => resolveMutation.mutate(violation.id)}
                  >
                    Lösen
                  </Button>
                )}
              </div>
              <p className="text-xs text-slate-700">
                Aktion: {violation.action_taken}
              </p>
              {violation.resolved && (
                <Badge variant="outline" className="text-xs mt-1">Gelöst</Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}