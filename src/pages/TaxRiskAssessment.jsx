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
import { AlertTriangle, Shield, TrendingUp } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function TaxRiskAssessment() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);

  const { data: assessment = {}, isLoading } = useQuery({
    queryKey: ['taxRisk', country, taxYear],
    queryFn: async () => {
      const response = await base44.functions.invoke('calculateTaxRisk', {
        country,
        taxYear
      });
      return response.data?.assessment || {};
    }
  });

  const analysis = assessment.analysis || {};
  const riskScore = analysis.overall_risk_score || 0;

  const getRiskColor = (score) => {
    if (score < 30) return { bg: 'bg-green-100', text: 'text-green-800', label: 'Niedrig' };
    if (score < 60) return { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Mittel' };
    return { bg: 'bg-red-100', text: 'text-red-800', label: 'Hoch' };
  };

  const riskColor = getRiskColor(riskScore);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">⚠️ Steuer-Risikobewertung</h1>
        <p className="text-slate-500 mt-1">Bewerten Sie Ihr Steuer-Risiko-Profil</p>
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
        <div className="text-center py-8">⏳ Risikobewertung wird durchgeführt...</div>
      ) : (
        <>
          {/* Risk Score */}
          <Card className={riskColor.bg}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className={`w-5 h-5 ${riskColor.text}`} />
                  Gesamt-Risiko-Score
                </CardTitle>
                <Badge className={riskColor.bg + ' ' + riskColor.text}>
                  {riskColor.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-4xl font-bold text-center">{Math.round(riskScore)}/100</div>
              <Progress value={riskScore} className="h-3" />
              <p className="text-sm text-center text-slate-600">
                {riskScore < 30 ? 'Ihr Steuerprofil ist gut dokumentiert und konform.' :
                 riskScore < 60 ? 'Es gibt einige Bereiche, die Aufmerksamkeit benötigen.' :
                 'Erhebliche Risiken erfordern sofortige Maßnahmen.'}
              </p>
            </CardContent>
          </Card>

          {/* Audit Probability */}
          {typeof analysis.audit_probability === 'number' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📋 Audit-Wahrscheinlichkeit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-bold">{Math.round(analysis.audit_probability)}%</span>
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <Progress value={analysis.audit_probability} className="h-2" />
              </CardContent>
            </Card>
          )}

          {/* Risk Categories */}
          {(analysis.risk_categories || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📊 Risiko-Kategorien</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.risk_categories.map((category, i) => (
                  <div key={i} className="border-l-4 border-red-300 pl-4 py-2">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-sm">{category.name || `Kategorie ${i + 1}`}</h4>
                      {category.severity && (
                        <Badge className={
                          category.severity === 'high' ? 'bg-red-100 text-red-800' :
                          category.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }>
                          {category.severity}
                        </Badge>
                      )}
                    </div>
                    {category.description && (
                      <p className="text-xs text-slate-600">{category.description}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Red Flags */}
          {(analysis.red_flags || []).length > 0 && (
            <Card className="border-red-300 bg-red-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  Warnsignale
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysis.red_flags.map((flag, i) => (
                  <div key={i} className="flex gap-2 text-sm p-2 bg-white rounded">
                    <span className="text-red-600 font-bold">!</span>
                    {flag}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Compliance Gaps */}
          {(analysis.compliance_gaps || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">🔍 Compliance-Lücken</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysis.compliance_gaps.map((gap, i) => (
                  <div key={i} className="flex gap-2 text-sm p-2 bg-yellow-50 rounded border border-yellow-200">
                    <span className="text-yellow-600 font-bold">→</span>
                    {gap}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Mitigation Strategies */}
          {(analysis.mitigation_strategies || []).length > 0 && (
            <Card className="border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  Minderungs-Strategien
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysis.mitigation_strategies.map((strategy, i) => (
                  <div key={i} className="flex gap-3 p-2 bg-white rounded text-sm">
                    <span className="font-bold text-green-600 flex-shrink-0">{i + 1}.</span>
                    {strategy}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Priority Actions */}
          {(analysis.priority_actions || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">⚡ Prioritäts-Maßnahmen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysis.priority_actions.map((action, i) => (
                  <div key={i} className="flex gap-3 p-2 bg-slate-50 rounded text-sm border-l-3 border-blue-500">
                    <span className="font-bold text-blue-600 flex-shrink-0">{i + 1}.</span>
                    {action}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}