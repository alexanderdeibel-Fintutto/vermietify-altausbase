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
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function TaxComplianceTracker() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);

  const { data: compliance = {}, isLoading } = useQuery({
    queryKey: ['taxCompliance', country, taxYear],
    queryFn: async () => {
      const response = await base44.functions.invoke('monitorTaxComplianceStatus', {
        country,
        taxYear
      });
      return response.data?.compliance_status || {};
    }
  });

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-300';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-300';
    return 'text-red-600 bg-red-50 border-red-300';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">✅ Tax Compliance Tracker</h1>
        <p className="text-slate-500 mt-1">Überwachen Sie Ihren Compliance-Status</p>
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
        <div className="text-center py-8">⏳ Compliance wird überprüft...</div>
      ) : (
        <>
          {/* Compliance Score */}
          <Card className={`border-2 ${getScoreColor(compliance.assessment?.compliance_score || 0)}`}>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-slate-600">Compliance-Bewertung</p>
                  <p className="text-4xl font-bold mt-2">
                    {Math.round(compliance.assessment?.compliance_score || 0)}%
                  </p>
                  <Progress 
                    value={compliance.assessment?.compliance_score || 0} 
                    className="mt-3"
                  />
                </div>
                <div className="text-center md:col-span-2">
                  <p className="text-sm text-slate-600">Status</p>
                  <Badge className={`mt-2 text-base py-2 px-4 ${
                    (compliance.assessment?.status || '').toLowerCase().includes('compliant')
                      ? 'bg-green-100 text-green-800'
                      : (compliance.assessment?.status || '').toLowerCase().includes('at risk')
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {compliance.assessment?.status || 'UNKNOWN'}
                  </Badge>
                  <p className="text-sm text-slate-700 mt-3">
                    {compliance.assessment?.overall_assessment || 'Keine Bewertung verfügbar'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Critical Issues */}
          {(compliance.assessment?.critical_issues || []).length > 0 && (
            <Card className="border-red-300 bg-red-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Kritische Probleme
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {compliance.assessment.critical_issues.map((issue, i) => (
                  <div key={i} className="flex gap-2 text-sm p-2 bg-white rounded">
                    <span className="flex-shrink-0 text-red-600">!</span>
                    {issue}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* At-Risk Items */}
          {(compliance.assessment?.at_risk_items || []).length > 0 && (
            <Card className="border-orange-300 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-sm">⚠️ Gefährdete Bereiche</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {compliance.assessment.at_risk_items.map((item, i) => (
                  <div key={i} className="flex gap-2 text-sm p-2 bg-white rounded">
                    <Clock className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                    {item}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Next Steps */}
          {(compliance.assessment?.next_steps || []).length > 0 && (
            <Card className="border-blue-300 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-sm">🚀 Nächste Schritte</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {compliance.assessment.next_steps.map((step, i) => (
                  <div key={i} className="flex gap-3 text-sm p-2 bg-white rounded">
                    <span className="font-bold text-blue-600 flex-shrink-0">{i + 1}.</span>
                    {step}
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