import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertTriangle, AlertCircle, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function DataValidationPanel({ entityType }) {
  const [autoFix, setAutoFix] = useState(false);

  const { data: validation = null, refetch } = useQuery({
    queryKey: ['data-validation', entityType],
    queryFn: async () => {
      const response = await base44.functions.invoke('validateDataComprehensive', {
        entityType: entityType
      });
      return response.data;
    }
  });

  const fixMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('autoFixIssue', {
        entityType: entityType,
        issues: validation?.issues || []
      });
      return response.data;
    },
    onSuccess: (result) => {
      toast.success(`✅ ${result.fixed} Fehler behoben`);
      refetch();
    }
  });

  if (!validation) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-sm text-slate-500">Validierung lädt...</p>
        </CardContent>
      </Card>
    );
  }

  const { issues = [], score = 0, summary = '' } = validation;
  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Datenqualität</span>
          <Badge className={score > 80 ? 'bg-emerald-100 text-emerald-800' : score > 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>
            {score}%
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        {summary && (
          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="w-4 h-4 text-blue-600" />
            <AlertDescription className="text-sm text-blue-800">
              {summary}
            </AlertDescription>
          </Alert>
        )}

        {/* Issues List */}
        <div className="space-y-2">
          {issues.length === 0 ? (
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm">Alle Daten sind valide</span>
            </div>
          ) : (
            <>
              <p className="text-sm font-medium">
                {errorCount} Fehler, {warningCount} Warnungen
              </p>
              {issues.slice(0, 5).map((issue, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded border-l-4 text-sm ${
                    issue.severity === 'error'
                      ? 'border-l-red-500 bg-red-50'
                      : 'border-l-yellow-500 bg-yellow-50'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {issue.severity === 'error' ? (
                      <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-xs">{issue.field}</p>
                      <p className="text-xs text-slate-600">{issue.message}</p>
                    </div>
                  </div>
                </div>
              ))}
              {issues.length > 5 && (
                <p className="text-xs text-slate-500">+ {issues.length - 5} weitere...</p>
              )}
            </>
          )}
        </div>

        {/* Auto Fix Button */}
        {errorCount > 0 && (
          <Button
            onClick={() => fixMutation.mutate()}
            disabled={fixMutation.isPending}
            className="w-full gap-2"
          >
            <Zap className="w-4 h-4" />
            {fixMutation.isPending ? 'Behebe...' : `${errorCount} Fehler automatisch beheben`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}