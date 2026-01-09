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
import {
  BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  CheckCircle2, AlertTriangle, TrendingUp, FileText, Shield
} from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function AuditReadinessAssessment() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);

  // Fetch assessment
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
      case 'low':
        return { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-900' };
      case 'medium':
        return { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-900' };
      case 'high':
        return { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-900' };
      default:
        return { bg: 'bg-slate-50', border: 'border-slate-300', text: 'text-slate-900' };
    }
  };

  const getRiskIcon = (level) => {
    switch (level?.toLowerCase()) {
      case 'low':
        return '✅';
      case 'medium':
        return '⚠️';
      case 'high':
        return '🔴';
      default:
        return 'ℹ️';
    }
  };

  const metricsData = [
    {
      name: 'Dokumente',
      value: assessment.metrics?.documentation_completeness || 0
    },
    {
      name: 'Compliance',
      value: assessment.metrics?.compliance_rate || 0
    },
    {
      name: 'Anträge',
      value: assessment.metrics?.filing_rate || 0
    }
  ];

  if (isLoading) {
    return <div className="text-center py-8">⏳ Lade Audit-Readiness Bewertung...</div>;
  }

  const riskColors = getRiskColor(assessment.risk_level);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">🛡️ Audit Readiness Assessment</h1>
        <p className="text-slate-500 mt-1">Bewerten Sie Ihre Bereitschaft für eine Steuerprüfung</p>
      </div>

      {/* Controls */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 max-w-xs">
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
        <div className="flex-1 max-w-xs">
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

      {/* Readiness Score */}
      <Card className={`border-2 ${riskColors.border} ${riskColors.bg}`}>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div>
              <p className={`text-sm font-medium ${riskColors.text}`}>Audit Readiness Score</p>
              <p className="text-4xl font-bold mt-2">{assessment.overall_readiness_score || 0}/100</p>
            </div>
            <div className="flex justify-center gap-2">
              <Badge className={`${riskColors.bg} ${riskColors.border} ${riskColors.text}`}>
                {getRiskIcon(assessment.risk_level)} {assessment.risk_level?.toUpperCase()} RISK
              </Badge>
            </div>
            <Progress value={assessment.overall_readiness_score || 0} />
            {assessment.summary && (
              <p className="text-sm text-slate-700 pt-2">{assessment.summary}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <FileText className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-slate-600">Dokumentation</p>
            <p className="text-2xl font-bold mt-1">{assessment.metrics?.documentation_completeness || 0}%</p>
            <Progress value={assessment.metrics?.documentation_completeness || 0} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-slate-600">Compliance</p>
            <p className="text-2xl font-bold mt-1">{assessment.metrics?.compliance_rate || 0}%</p>
            <Progress value={assessment.metrics?.compliance_rate || 0} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <TrendingUp className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
            <p className="text-sm text-slate-600">Kritische Issues</p>
            <p className="text-2xl font-bold mt-1">{assessment.audit_indicators?.critical_issues || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Metrics Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">📊 Audit Readiness Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metricsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value) => `${value}%`} />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Documentation Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">📄 Dokumentations-Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-3 bg-blue-50 rounded border border-blue-200">
              <p className="text-2xl font-bold text-blue-600">{assessment.documentation_status?.total_documents || 0}</p>
              <p className="text-xs text-slate-600 mt-1">Dokumente</p>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded border border-slate-200">
              <p className="text-2xl font-bold">{assessment.documentation_status?.documents_by_type?.length || 0}</p>
              <p className="text-xs text-slate-600 mt-1">Typen</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded border border-green-200">
              <p className="text-2xl font-bold text-green-600">{assessment.compliance_status?.completed || 0}</p>
              <p className="text-xs text-slate-600 mt-1">Erfüllt</p>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded border border-yellow-200">
              <p className="text-2xl font-bold text-yellow-600">{assessment.compliance_status?.pending || 0}</p>
              <p className="text-xs text-slate-600 mt-1">Ausstehend</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strengths */}
      {(assessment.strengths || []).length > 0 && (
        <Card className="border-green-300 bg-green-50">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              ✅ Stärken
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {assessment.strengths.map((strength, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="text-green-600 font-bold">✓</span> {strength}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Weaknesses */}
      {(assessment.weaknesses || []).length > 0 && (
        <Card className="border-red-300 bg-red-50">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              ⚠️ Schwachstellen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {assessment.weaknesses.map((weakness, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="text-red-600 font-bold">✗</span> {weakness}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Audit Risk Areas */}
      {(assessment.audit_risk_areas || []).length > 0 && (
        <Card className="border-orange-300 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              🎯 Potenzielle Audit-Fokus-Bereiche
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {assessment.audit_risk_areas.map((area, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="text-orange-600">→</span> {area}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Priority Improvements */}
      {(assessment.priority_improvements || []).length > 0 && (
        <Card className="border-blue-300 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              🚀 Prioritäre Verbesserungen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {assessment.priority_improvements.map((improvement, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <Badge className="bg-blue-200 text-blue-800 text-xs flex-shrink-0 mt-0.5">
                    {i + 1}
                  </Badge>
                  {improvement}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Documentation Gaps */}
      {(assessment.documentation_gaps || []).length > 0 && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-sm">📋 Dokumentationslücken</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {assessment.documentation_gaps.map((gap, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="text-yellow-600">◆</span> {gap}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}