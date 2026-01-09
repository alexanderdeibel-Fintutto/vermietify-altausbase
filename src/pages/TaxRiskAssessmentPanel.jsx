import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function TaxRiskAssessmentPanel() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [assessing, setAssessing] = useState(false);

  const { data: profile = {}, isLoading } = useQuery({
    queryKey: ['taxRiskProfile', country, taxYear],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateTaxRiskProfile', {
        country,
        taxYear
      });
      return response.data?.profile || {};
    },
    enabled: assessing
  });

  const getRiskColor = (score) => {
    if (score >= 8) return { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-600', label: 'Sehr hoch' };
    if (score >= 6) return { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-600', label: 'Hoch' };
    if (score >= 4) return { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-600', label: 'Mittel' };
    return { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-600', label: 'Niedrig' };
  };

  const riskColor = getRiskColor(profile.content?.overall_risk_score || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">🎯 Steuer-Risiko Bewertung</h1>
        <p className="text-slate-500 mt-1">Bewerten Sie Ihr Steuer-Auditrisiko</p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              {[CURRENT_YEAR - 1, CURRENT_YEAR].map(year => (
                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <button
        onClick={() => setAssessing(true)}
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:opacity-50"
        disabled={assessing}
      >
        {assessing ? '⏳ Wird bewertet...' : 'Risikobewertung starten'}
      </button>

      {isLoading ? (
        <div className="text-center py-8">⏳ Bewertung läuft...</div>
      ) : assessing && profile.content ? (
        <>
          {/* Overall Risk Score */}
          <Card className={`border-4 ${riskColor.border} ${riskColor.bg}`}>
            <CardHeader>
              <CardTitle className="text-sm">🎯 Gesamtrisikoscore</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className={`text-4xl font-bold ${riskColor.text}`}>
                  {Math.round(profile.content.overall_risk_score || 0)}/10
                </p>
                <p className={`text-sm font-medium ${riskColor.text} mt-2`}>
                  {riskColor.label}
                </p>
              </div>
              <Progress 
                value={Math.min((profile.content.overall_risk_score || 0) * 10, 100)} 
                className="mt-4 h-2"
              />
            </CardContent>
          </Card>

          {/* Documentation & Compliance Scores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-slate-600">Dokumentationsscore</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">
                  {Math.round((profile.content.documentation_score || 0) * 100)}%
                </p>
                <Progress 
                  value={Math.round((profile.content.documentation_score || 0) * 100)} 
                  className="mt-2 h-2"
                />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-slate-600">Compliance-Rating</p>
                <p className="text-2xl font-bold text-purple-600 mt-2">
                  {profile.content.compliance_rating || 'Unbekannt'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Red Flags */}
          {(profile.content?.red_flags || []).length > 0 && (
            <Card className="border-red-300 bg-red-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  🚩 Rote Flaggen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {profile.content.red_flags.map((flag, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded">
                    <p className="font-medium">{flag.issue || flag.name}</p>
                    <p className="text-xs text-slate-600 mt-1">{flag.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* High Risk Areas */}
          {(profile.content?.high_risk_areas || []).length > 0 && (
            <Card className="border-orange-300 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-sm">⚠️ Hochrisiko-Bereiche</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {profile.content.high_risk_areas.map((area, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded">
                    • {area}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Mitigation Strategies */}
          {(profile.content?.mitigation_strategies || []).length > 0 && (
            <Card className="border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  ✓ Risikominderungsstrategien
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {profile.content.mitigation_strategies.map((strategy, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded flex gap-2">
                    <span className="text-green-600 font-bold flex-shrink-0">{i + 1}.</span>
                    {strategy}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Monitoring Recommendations */}
          {(profile.content?.monitoring_recommendations || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  📋 Überwachungsempfehlungen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {profile.content.monitoring_recommendations.map((rec, i) => (
                  <div key={i} className="text-sm p-2 bg-slate-50 rounded flex gap-2">
                    <span className="text-blue-600 font-bold flex-shrink-0">{i + 1}.</span>
                    {rec}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-slate-500">
          Klicken Sie "Risikobewertung starten", um Ihre Steuern zu analysieren
        </div>
      )}
    </div>
  );
}