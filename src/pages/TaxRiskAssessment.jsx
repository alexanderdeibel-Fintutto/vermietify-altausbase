import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, AlertCircle, CheckCircle2, Shield } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function TaxRiskAssessment() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);

  const { data: assessment = {}, isLoading } = useQuery({
    queryKey: ['taxRiskAssessment', country, taxYear],
    queryFn: async () => {
      const response = await base44.functions.invoke('calculateTaxRisk', {
        country,
        taxYear
      });
      return response.data?.risk_assessment || {};
    }
  });

  const getRiskColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'critical':
        return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' };
      case 'high':
        return { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' };
      case 'medium':
        return { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' };
      default:
        return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' };
    }
  };

  const getRiskIcon = (level) => {
    switch (level?.toLowerCase()) {
      case 'critical':
        return '🔴';
      case 'high':
        return '🟠';
      case 'medium':
        return '🟡';
      default:
        return '🟢';
    }
  };

  const riskColors = getRiskColor(assessment.analysis?.risk_level);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">🛡️ Tax Risk Assessment</h1>
        <p className="text-slate-500 mt-1">Umfassende Bewertung Ihres Steuer-Compliance-Risikos</p>
      </div>

      {/* Controls */}
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

      {isLoading ? (
        <div className="text-center py-8">⏳ Bewerte Risiken...</div>
      ) : (
        <>
          {/* Risk Summary */}
          <Card className={`border-2 ${riskColors.border} ${riskColors.bg}`}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start gap-4 mb-4">
                <div>
                  <p className="text-sm text-slate-600">Gesamtrisiko-Score</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <p className="text-4xl font-bold">{assessment.analysis?.overall_risk_score || 0}</p>
                    <p className="text-lg">/ 100</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl">{getRiskIcon(assessment.analysis?.risk_level)}</p>
                  <Badge className={`${riskColors.bg} ${riskColors.text} mt-2`}>
                    {assessment.analysis?.risk_level?.toUpperCase() || 'UNKNOWN'}
                  </Badge>
                </div>
              </div>
              <Progress value={assessment.analysis?.overall_risk_score || 0} className="h-3" />
            </CardContent>
          </Card>

          {/* Audit Vulnerability */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">🔍 Prüfungs-Anfälligkeit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-slate-600">Anfälligkeit</span>
                  <span className="text-sm font-medium">
                    {assessment.analysis?.audit_vulnerability_score || 0}%
                  </span>
                </div>
                <Progress value={assessment.analysis?.audit_vulnerability_score || 0} className="h-2" />
              </div>
              <p className="text-xs text-slate-700">
                Je höher der Wert, desto wahrscheinlicher ist eine Prüfung.
              </p>
            </CardContent>
          </Card>

          {/* Risk Factors */}
          {(assessment.analysis?.key_risk_factors || []).length > 0 && (
            <Card className="border-orange-300 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-sm">⚠️ Wichtigste Risikofaktoren</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {assessment.analysis.key_risk_factors.map((factor, i) => (
                  <div key={i} className="flex gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                    <span>{factor}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Compliance Gaps */}
          {(assessment.analysis?.compliance_gaps || []).length > 0 && (
            <Card className="border-red-300 bg-red-50">
              <CardHeader>
                <CardTitle className="text-sm">❌ Compliance-Lücken</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {assessment.analysis.compliance_gaps.map((gap, i) => (
                  <div key={i} className="flex gap-2 text-sm">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <span>{gap}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Mitigation Recommendations */}
          {(assessment.analysis?.mitigation_recommendations || []).length > 0 && (
            <Card className="border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle className="text-sm">✅ Risiko-Minderungsmaßnahmen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {assessment.analysis.mitigation_recommendations.map((rec, i) => (
                  <div key={i} className="flex gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Priority Actions */}
          {(assessment.analysis?.priority_actions || []).length > 0 && (
            <Alert className="border-blue-300 bg-blue-50">
              <AlertDescription className="text-blue-900">
                <strong className="text-sm">🎯 Sofort-Maßnahmen:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                  {assessment.analysis.priority_actions.map((action, i) => (
                    <li key={i}>{action}</li>
                  ))}
                </ol>
              </AlertDescription>
            </Alert>
          )}

          {/* Timeline */}
          {assessment.analysis?.timeline && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📅 Umsetzungs-Timeline</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-700">
                {assessment.analysis.timeline}
              </CardContent>
            </Card>
          )}

          {/* Data Summary */}
          <Card className="border-slate-300 bg-slate-50">
            <CardHeader>
              <CardTitle className="text-sm">📊 Daten-Zusammenfassung</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center text-sm">
              <div>
                <p className="text-slate-600">Dokumente</p>
                <p className="text-2xl font-bold">{assessment.data_summary?.documents || 0}</p>
              </div>
              <div>
                <p className="text-slate-600">Anträge</p>
                <p className="text-2xl font-bold">{assessment.data_summary?.filings || 0}</p>
              </div>
              <div>
                <p className="text-slate-600">Compliance</p>
                <p className="text-2xl font-bold">{assessment.data_summary?.compliance_items || 0}</p>
              </div>
              <div>
                <p className="text-slate-600">Audits</p>
                <p className="text-2xl font-bold">{assessment.data_summary?.audits || 0}</p>
              </div>
              <div>
                <p className="text-slate-600">Warnungen</p>
                <p className="text-2xl font-bold">{assessment.data_summary?.alerts || 0}</p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}