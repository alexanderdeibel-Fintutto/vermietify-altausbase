import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function AuditReadinessAssessment() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR - 1);
  const [assessing, setAssessing] = useState(false);

  const { data: assessment = {}, isLoading } = useQuery({
    queryKey: ['auditReadiness', country, taxYear],
    queryFn: async () => {
      const response = await base44.functions.invoke('assessAuditReadiness', {
        country,
        taxYear
      });
      return response.data?.assessment || {};
    },
    enabled: assessing
  });

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskColor = (level) => {
    if (level === 'low') return 'border-green-300 bg-green-50';
    if (level === 'medium') return 'border-yellow-300 bg-yellow-50';
    return 'border-red-300 bg-red-50';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">🔍 Audit Readiness</h1>
        <p className="text-slate-500 mt-1">Bewerten Sie Ihre Audit-Bereitschaft</p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium">Land</label>
          <Select value={country} onValueChange={setCountry} disabled={assessing}>
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
          <Select value={String(taxYear)} onValueChange={(v) => setTaxYear(parseInt(v))} disabled={assessing}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[CURRENT_YEAR - 2, CURRENT_YEAR - 1].map(year => (
                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button
            onClick={() => setAssessing(true)}
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={assessing}
          >
            Bewertung
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">⏳ Bewertung läuft...</div>
      ) : assessing && Object.keys(assessment).length > 0 ? (
        <>
          {/* Overall Score */}
          <Card className={getRiskColor(assessment.audit_risk_level)}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Gesamt-Audit-Bereitschaft</p>
                  <p className={`text-4xl font-bold mt-2 ${getScoreColor(assessment.readiness_score)}`}>
                    {Math.round(assessment.readiness_score || 0)}%
                  </p>
                  <p className="text-sm mt-2 font-medium capitalize">{assessment.status}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-600">Audit-Risiko</p>
                  <p className={`text-lg font-bold mt-2 ${
                    assessment.audit_risk_level === 'low' ? 'text-green-600' :
                    assessment.audit_risk_level === 'medium' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {assessment.audit_risk_level?.toUpperCase()}
                  </p>
                  {assessment.weeks_to_prepare && (
                    <p className="text-xs text-slate-600 mt-1">
                      {assessment.weeks_to_prepare} Wochen bis Vorbereitung
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Component Scores */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">📊 Detaillierte Scores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'Dokumentation', score: assessment.documentation_score },
                { label: 'Compliance', score: assessment.compliance_score },
                { label: 'Archivierung', score: assessment.record_retention_score }
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">{item.label}</span>
                    <span className={`text-sm font-bold ${getScoreColor(item.score)}`}>
                      {Math.round(item.score || 0)}%
                    </span>
                  </div>
                  <Progress value={item.score || 0} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Red Flags */}
          {(assessment.red_flags || []).length > 0 && (
            <Card className="border-red-300 bg-red-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  🚩 Rote Flaggen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {assessment.red_flags.map((flag, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded">
                    ⚠️ {flag}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Critical Gaps */}
          {(assessment.critical_gaps || []).length > 0 && (
            <Card className="border-orange-300 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-sm">🔴 Kritische Lücken</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {assessment.critical_gaps.map((gap, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded">
                    • {gap}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {(assessment.recommendations || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  💡 Empfehlungen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {assessment.recommendations.map((rec, i) => (
                  <div key={i} className="text-sm p-2 bg-slate-50 rounded flex gap-2">
                    <span className="text-green-600 font-bold flex-shrink-0">{i + 1}.</span>
                    {rec}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          {assessment.weeks_to_prepare && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Vorbereitungszeit</p>
                    <p className="text-xs text-slate-600">
                      {assessment.weeks_to_prepare} Wochen empfohlen
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-slate-500">
          Klicken Sie "Bewertung", um Ihre Audit-Bereitschaft zu prüfen
        </div>
      )}
    </div>
  );
}