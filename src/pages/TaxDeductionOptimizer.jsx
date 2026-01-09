import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Zap, CheckCircle2, AlertTriangle } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function TaxDeductionOptimizer() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [analyze, setAnalyze] = useState(false);

  const { data: optimization = {}, isLoading } = useQuery({
    queryKey: ['taxDeductions', country, taxYear],
    queryFn: async () => {
      const response = await base44.functions.invoke('optimizeTaxDeductionsAdvanced', {
        country,
        taxYear
      });
      return response.data?.optimization || {};
    },
    enabled: analyze
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">💰 Tax Deduction Optimizer</h1>
        <p className="text-slate-500 mt-1">Maximieren Sie Ihre Steuervergünstigungen</p>
      </div>

      {/* Controls */}
      <Card className="border-2 border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">🎯 Analyse-Parameter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Land</label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AT">🇦🇹 Österreich</SelectItem>
                  <SelectItem value="CH">🇨🇭 Schweiz</SelectItem>
                  <SelectItem value="DE">🇩🇪 Deutschland</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Steuerjahr</label>
              <Select value={String(taxYear)} onValueChange={(v) => setTaxYear(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={String(CURRENT_YEAR - 1)}>{CURRENT_YEAR - 1}</SelectItem>
                  <SelectItem value={String(CURRENT_YEAR)}>{CURRENT_YEAR}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={() => setAnalyze(true)}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Zap className="w-4 h-4 mr-2" />
            Abzüge Analysieren
          </Button>
        </CardContent>
      </Card>

      {isLoading && analyze && (
        <div className="text-center py-8">⏳ Abzüge werden analysiert...</div>
      )}

      {analyze && optimization.analysis && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-green-300 bg-green-50">
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600">Geschätzte Ersparnis</p>
                <p className="text-4xl font-bold text-green-600 mt-2">
                  €{Math.round(optimization.analysis?.estimated_savings || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card className={`border-2 ${
              optimization.analysis?.compliance_risk?.toLowerCase() === 'low'
                ? 'border-green-300 bg-green-50'
                : 'border-orange-300 bg-orange-50'
            }`}>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600">Compliance-Risiko</p>
                <Badge className={`mt-2 ${
                  optimization.analysis?.compliance_risk?.toLowerCase() === 'low'
                    ? 'bg-green-200 text-green-800'
                    : 'bg-orange-200 text-orange-800'
                }`}>
                  {optimization.analysis?.compliance_risk || 'UNKNOWN'}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Opportunities */}
          {(optimization.analysis?.opportunities || []).length > 0 && (
            <Card className="border-2 border-blue-300 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-sm">⭐ Top Abzugs-Möglichkeiten</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {optimization.analysis.opportunities.map((opp, i) => (
                  <div key={i} className="p-3 bg-white rounded border border-blue-200">
                    <div className="flex items-start gap-2">
                      <span className="text-xl">{i + 1}.</span>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{opp.title || opp.name || `Möglichkeit ${i + 1}`}</p>
                        {opp.description && (
                          <p className="text-xs text-slate-600 mt-1">{opp.description}</p>
                        )}
                        {opp.potential_savings && (
                          <p className="text-sm text-green-600 font-bold mt-2">
                            💚 €{Math.round(opp.potential_savings).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Implementation Steps */}
          {(optimization.analysis?.implementation_steps || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">🚀 Umsetzungsschritte</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {optimization.analysis.implementation_steps.map((step, i) => (
                  <div key={i} className="flex gap-3 p-2 bg-slate-50 rounded text-sm">
                    <span className="font-bold text-blue-600 flex-shrink-0">{i + 1}.</span>
                    {step}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Required Documents */}
          {(optimization.analysis?.required_documents || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📄 Erforderliche Unterlagen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {optimization.analysis.required_documents.map((doc, i) => (
                  <div key={i} className="flex gap-2 text-sm p-2 bg-slate-50 rounded">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    {doc}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          {optimization.analysis?.timeline && (
            <Alert className="border-blue-300 bg-blue-50">
              <AlertDescription className="text-sm">
                <strong>📅 Zeitplan:</strong> {optimization.analysis.timeline}
              </AlertDescription>
            </Alert>
          )}

          {/* Quarterly Impact */}
          {optimization.analysis?.quarterly_impact && (
            <Alert className="border-green-300 bg-green-50">
              <AlertDescription className="text-sm">
                <strong>💰 Vierteljährliche Auswirkung:</strong> €{Math.round(optimization.analysis.quarterly_impact).toLocaleString()} pro Quartal
              </AlertDescription>
            </Alert>
          )}
        </>
      )}
    </div>
  );
}