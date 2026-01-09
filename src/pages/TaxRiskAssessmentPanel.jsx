import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Shield, TrendingUp } from 'lucide-react';

export default function TaxRiskAssessmentPanel() {
  const [country, setCountry] = useState('DE');
  const [income, setIncome] = useState(100000);
  const [deductions, setDeductions] = useState(10000);
  const [filingStatus, setFilingStatus] = useState('single');
  const [assessing, setAssessing] = useState(false);

  const { data: result = {}, isLoading } = useQuery({
    queryKey: ['taxRiskAssessment', country, income, deductions, filingStatus],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateTaxRiskAssessment', {
        country,
        income,
        deductions,
        filingStatus
      });
      return response.data?.assessment || {};
    },
    enabled: assessing
  });

  const getRiskColor = (score) => {
    if (score <= 20) return { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-600', label: 'Sehr niedrig' };
    if (score <= 40) return { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-600', label: 'Niedrig' };
    if (score <= 60) return { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-600', label: 'Mittel' };
    if (score <= 80) return { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-600', label: 'Hoch' };
    return { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-600', label: 'Sehr hoch' };
  };

  const riskColor = getRiskColor(result.content?.risk_score || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">🛡️ Steuer-Risikobewertung</h1>
        <p className="text-slate-500 mt-1">Prüfungsrisiko identifizieren und mindern</p>
      </div>

      {/* Input Form */}
      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">Profil-Informationen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
              <label className="text-sm font-medium">Familienstand</label>
              <Select value={filingStatus} onValueChange={setFilingStatus} disabled={assessing}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Ledig</SelectItem>
                  <SelectItem value="married">Verheiratet</SelectItem>
                  <SelectItem value="divorced">Geschieden</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Einkommen (€)</label>
              <Input type="number" value={income} onChange={(e) => setIncome(parseInt(e.target.value) || 0)} disabled={assessing} />
            </div>
            <div>
              <label className="text-sm font-medium">Abzüge (€)</label>
              <Input type="number" value={deductions} onChange={(e) => setDeductions(parseInt(e.target.value) || 0)} disabled={assessing} />
            </div>
          </div>

          <button
            onClick={() => setAssessing(true)}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:opacity-50"
            disabled={assessing}
          >
            {assessing ? '⏳ Wird bewertet...' : 'Risiko bewerten'}
          </button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8">⏳ Bewertung läuft...</div>
      ) : assessing && result.content ? (
        <>
          {/* Risk Score */}
          <Card className={`border-4 ${riskColor.border} ${riskColor.bg}`}>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Risikobewertung
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <p className={`text-4xl font-bold ${riskColor.text}`}>{Math.round(result.content.risk_score || 0)}</p>
                <span className={`text-lg font-bold ${riskColor.text}`}>{riskColor.label}</span>
              </div>
              <Progress value={result.content.risk_score || 0} className="h-3" />
            </CardContent>
          </Card>

          {/* Audit Probability */}
          {result.content?.audit_probability !== undefined && (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-slate-600">Prüfungswahrscheinlichkeit</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">
                  {Math.round((result.content.audit_probability || 0) * 100)}%
                </p>
              </CardContent>
            </Card>
          )}

          {/* High Risk Areas */}
          {(result.content?.high_risk_areas || []).length > 0 && (
            <Card className="border-red-300 bg-red-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Hochrisiko-Bereiche
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.content.high_risk_areas.map((area, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded">
                    ⚠️ {area}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Compliance Gaps */}
          {(result.content?.compliance_gaps || []).length > 0 && (
            <Card className="border-orange-300 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-sm">📋 Compliance-Lücken</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.content.compliance_gaps.map((gap, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded">
                    • {gap}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Mitigation Steps */}
          {(result.content?.mitigation_steps || []).length > 0 && (
            <Card className="border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle className="text-sm">✓ Risiko mindern</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.content.mitigation_steps.map((step, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded flex gap-2">
                    <span className="text-green-600 font-bold flex-shrink-0">{i + 1}.</span>
                    {step}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-slate-500">
          Füllen Sie das Formular aus und klicken Sie "Risiko bewerten"
        </div>
      )}
    </div>
  );
}