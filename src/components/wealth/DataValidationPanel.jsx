import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, AlertTriangle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';

export default function DataValidationPanel({ userId }) {
  const queryClient = useQueryClient();

  const { data: validationResult, isLoading } = useQuery({
    queryKey: ['dataValidation', userId],
    queryFn: async () => {
      if (!userId) return null;
      const response = await base44.functions.invoke('validateAssetData', {});
      return response.data;
    },
    staleTime: 30 * 60 * 1000
  });

  const validateMutation = useMutation({
    mutationFn: async () => {
      await base44.functions.invoke('validateAssetData', {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataValidation', userId] });
    }
  });

  const syncPricesMutation = useMutation({
    mutationFn: async () => {
      await base44.functions.invoke('finapiSyncAssetPrices', {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assetPortfolio'] });
      queryClient.invalidateQueries({ queryKey: ['dataValidation', userId] });
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center h-40">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    );
  }

  if (!validationResult) {
    return null;
  }

  const { overall_score, total_assets, total_issues, validation_results = [], recommendations = [] } = validationResult;

  const criticalCount = validation_results.filter(r => r.errors.length > 0).length;
  const warningCount = validation_results.filter(r => r.warnings.length > 0 && r.errors.length === 0).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-light flex items-center justify-between">
          <span>Datenqualität</span>
          <Badge className={
            overall_score >= 80 ? 'bg-green-100 text-green-800' :
            overall_score >= 60 ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }>
            {overall_score}%
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-light text-slate-700">Gesamtscore</p>
            <p className="text-sm font-light text-slate-600">
              {total_assets} Assets, {total_issues} Problem(e)
            </p>
          </div>
          <Progress value={overall_score} className="h-2" />
        </div>

        {/* Issues Summary */}
        {(criticalCount > 0 || warningCount > 0) && (
          <div className="grid grid-cols-2 gap-3">
            {criticalCount > 0 && (
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded border border-red-200">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <div>
                  <p className="text-xs font-light text-red-700">{criticalCount} kritisch</p>
                  <p className="text-xs text-red-600">Fehler</p>
                </div>
              </div>
            )}
            {warningCount > 0 && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded border border-yellow-200">
                <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                <div>
                  <p className="text-xs font-light text-yellow-700">{warningCount} Warnung(en)</p>
                  <p className="text-xs text-yellow-600">Aufmerksamkeit</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-light text-slate-700">Empfehlungen:</p>
            {recommendations.map((rec, idx) => (
              <div
                key={idx}
                className={`p-3 rounded text-xs font-light ${
                  rec.type === 'critical'
                    ? 'bg-red-50 text-red-800 border border-red-200'
                    : rec.type === 'warning'
                    ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                    : 'bg-blue-50 text-blue-800 border border-blue-200'
                }`}
              >
                {rec.message}
              </div>
            ))}
          </div>
        )}

        {/* Detailed Issues */}
        {validation_results.some(r => r.errors.length > 0 || r.warnings.length > 0) && (
          <div className="max-h-64 overflow-y-auto space-y-2">
            {validation_results
              .filter(r => r.errors.length > 0 || r.warnings.length > 0)
              .slice(0, 5)
              .map((result) => (
                <div key={result.id} className="p-3 border border-slate-200 rounded text-xs font-light">
                  <p className="font-medium text-slate-900 mb-1">{result.name}</p>
                  {result.errors.length > 0 && (
                    <ul className="text-red-700 mb-1 ml-3">
                      {result.errors.map((err, idx) => (
                        <li key={idx}>✗ {err}</li>
                      ))}
                    </ul>
                  )}
                  {result.warnings.length > 0 && (
                    <ul className="text-yellow-700 ml-3">
                      {result.warnings.map((warn, idx) => (
                        <li key={idx}>⚠ {warn}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t border-slate-200">
          <Button
            onClick={() => validateMutation.mutate()}
            disabled={validateMutation.isPending}
            variant="outline"
            className="flex-1 font-light gap-2 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Validieren
          </Button>
          <Button
            onClick={() => syncPricesMutation.mutate()}
            disabled={syncPricesMutation.isPending}
            className="flex-1 bg-slate-900 hover:bg-slate-800 font-light gap-2 text-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            Kurse synchronisieren
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}