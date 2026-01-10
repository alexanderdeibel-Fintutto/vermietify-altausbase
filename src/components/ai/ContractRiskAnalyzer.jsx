import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, Upload, ShieldAlert, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ContractRiskAnalyzer() {
  const [analysis, setAnalysis] = useState(null);

  const analyzeMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const response = await base44.functions.invoke('analyzeContractRisks', { file_url });
      return response.data;
    },
    onSuccess: (data) => {
      setAnalysis(data);
      toast.success('Risikoanalyse abgeschlossen');
    }
  });

  const riskColors = {
    high: 'bg-red-600',
    medium: 'bg-orange-600',
    low: 'bg-yellow-600',
    none: 'bg-green-600'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5" />
          Vertragsrisiko-Analyse
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-orange-50 rounded-lg">
          <p className="text-sm text-orange-800">
            KI prüft Verträge auf Risiken, unübliche Klauseln und rechtliche Probleme
          </p>
        </div>

        <input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={(e) => e.target.files?.[0] && analyzeMutation.mutate(e.target.files[0])}
          className="hidden"
          id="contract-risk"
        />
        <label htmlFor="contract-risk">
          <Button asChild className="w-full" disabled={analyzeMutation.isPending}>
            <span>
              <Upload className="w-4 h-4 mr-2" />
              {analyzeMutation.isPending ? 'Analysiere...' : 'Vertrag analysieren'}
            </span>
          </Button>
        </label>

        {analysis && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold">Gesamt-Risiko-Score</p>
                <Badge className={riskColors[analysis.risk_level]}>
                  {analysis.risk_level.toUpperCase()}
                </Badge>
              </div>
              <Progress value={analysis.risk_score} className="h-3" />
              <p className="text-xs text-slate-600 mt-1">{analysis.risk_score}/100</p>
            </div>

            <div className="space-y-2">
              <p className="font-semibold text-sm">Erkannte Risiken:</p>
              {analysis.risks.length === 0 ? (
                <div className="p-3 bg-green-50 rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-sm text-green-800">Keine Risiken erkannt</p>
                </div>
              ) : (
                analysis.risks.map((risk, idx) => (
                  <div key={idx} className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{risk.title}</p>
                        <p className="text-xs text-slate-600 mt-1">{risk.description}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge className={riskColors[risk.severity]}>
                            {risk.severity}
                          </Badge>
                          <Badge variant="outline">Klausel: §{risk.clause_reference}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {analysis.deviations.length > 0 && (
              <div className="space-y-2">
                <p className="font-semibold text-sm">Abweichungen vom Standard:</p>
                {analysis.deviations.map((dev, idx) => (
                  <div key={idx} className="p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm font-semibold">{dev.field}</p>
                    <p className="text-xs text-slate-600">{dev.description}</p>
                    <Badge className="bg-yellow-600 mt-2">{dev.impact}</Badge>
                  </div>
                ))}
              </div>
            )}

            {analysis.recommendations.length > 0 && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="font-semibold text-sm mb-2">Empfehlungen:</p>
                {analysis.recommendations.map((rec, idx) => (
                  <p key={idx} className="text-xs text-blue-800">• {rec}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}