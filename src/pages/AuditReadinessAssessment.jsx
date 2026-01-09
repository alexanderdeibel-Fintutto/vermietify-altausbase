import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle2, Shield } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function AuditReadinessAssessment() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);

  const { data: assessment = {}, isLoading } = useQuery({
    queryKey: ['auditReadiness', country, taxYear],
    queryFn: async () => {
      const response = await base44.functions.invoke('assessAuditReadiness', {
        country,
        taxYear
      });
      return response.data?.assessment || {};
    }
  });

  const getRiskColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'critical':
      case 'high':
        return 'text-red-600 bg-red-50 border-red-300';
      case 'medium':
        return 'text-orange-600 bg-orange-50 border-orange-300';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-300';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-300';
    }
  };

  const getRiskIcon = (level) => {
    switch (level?.toLowerCase()) {
      case 'critical':
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return '⚪';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">🛡️ Audit Readiness Assessment</h1>
        <p className="text-slate-500 mt-1">Umfassende Prüfung Ihrer Audit-Bereitschaft</p>
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
              <SelectItem value={String(CURRENT_YEAR - 2)}>{CURRENT_YEAR - 2}</SelectItem>
              <SelectItem value={String(CURRENT_YEAR - 1)}>{CURRENT_YEAR - 1}</SelectItem>
              <SelectItem value={String(CURRENT_YEAR)}>{CURRENT_YEAR}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">⏳ Lade Audit-Bereitschaft...</div>
      ) : (
        <>
          {/* Overall Score */}
          <Card className="border-2 border-blue-300 bg-blue-50">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-slate-600">Gesamt-Bereitschaft</p>
                  <p className="text-4xl font-bold text-blue-600 mt-2">
                    {assessment.assessment?.overall_readiness || 0}%
                  </p>
                  <Progress 
                    value={assessment.assessment?.overall_readiness || 0} 
                    className="mt-3 h-2"
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-600">Dokumentation</p>
                  <p className="text-4xl font-bold text-blue-600 mt-2">
                    {assessment.assessment?.record_keeping_score || 0}%
                  </p>
                  <Progress 
                    value={assessment.assessment?.record_keeping_score || 0} 
                    className="mt-3 h-2"
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-600">Audit-Risiko</p>
                  <Badge className={`mt-2 ${getRiskColor(assessment.assessment?.audit_risk_level)}`}>
                    {getRiskIcon(assessment.assessment?.audit_risk_level)} {
                      assessment.assessment?.audit_risk_level?.toUpperCase() || 'UNKNOWN'
                    }
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vulnerabilities */}
          {(assessment.assessment?.vulnerabilities || []).length > 0 && (
            <Card className="border-red-300 bg-red-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Kritische Schwachstellen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {assessment.assessment.vulnerabilities.map((vuln, i) => (
                  <div key={i} className="p-3 bg-white rounded border border-red-200">
                    <p className="font-medium text-red-900">{vuln.issue || vuln.title}</p>
                    {vuln.severity && (
                      <Badge className="mt-2 bg-red-200 text-red-800 text-xs">
                        {vuln.severity.toUpperCase()}
                      </Badge>
                    )}
                    {vuln.impact && (
                      <p className="text-sm text-red-800 mt-2">Auswirkung: {vuln.impact}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Documentation Gaps */}
          {(assessment.assessment?.documentation_gaps || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📋 Dokumentationslücken</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {assessment.assessment.documentation_gaps.map((gap, i) => (
                  <div key={i} className="flex gap-2 text-sm p-2 bg-yellow-50 rounded border border-yellow-200">
                    <span className="text-yellow-600 flex-shrink-0">⚠️</span>
                    {gap}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Compliance Issues */}
          {(assessment.assessment?.compliance_issues || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">🔍 Compliance-Probleme</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {assessment.assessment.compliance_issues.map((issue, i) => (
                  <div key={i} className="flex gap-2 text-sm">
                    <span className="flex-shrink-0">→</span>
                    {issue}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* High Risk Areas */}
          {(assessment.assessment?.high_risk_areas || []).length > 0 && (
            <Alert className="border-orange-300 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-900">
                <strong>🎯 Hochrisiko-Bereiche:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  {assessment.assessment.high_risk_areas.map((area, i) => (
                    <li key={i}>• {area}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Recommended Actions */}
          {(assessment.assessment?.recommended_actions || []).length > 0 && (
            <Card className="border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Empfehlung Maßnahmen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {assessment.assessment.recommended_actions.map((action, i) => (
                  <div key={i} className="flex gap-2 text-sm p-2 bg-white rounded border border-green-200">
                    <span className="text-green-600 font-bold flex-shrink-0">{i + 1}.</span>
                    {action}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Summary */}
          <Card className="bg-slate-50">
            <CardContent className="pt-6 text-sm text-slate-700 space-y-2">
              <p>
                <strong>Geschätztes Risiko:</strong> {
                  assessment.assessment?.estimated_vulnerability_percentage || 0
                }%
              </p>
              <p>
                <strong>Timeline Adequacy:</strong> {assessment.assessment?.timeline_adequacy || 'N/A'}
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}