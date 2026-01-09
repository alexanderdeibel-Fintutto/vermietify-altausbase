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
import { AlertTriangle, CheckCircle2, Clock, TrendingUp } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function ComprehensiveTaxDashboard() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);

  const { data: result = {}, isLoading } = useQuery({
    queryKey: ['taxDashboard', country, taxYear],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateComprehensiveTaxDashboard', {
        country,
        taxYear
      });
      return response.data?.dashboard || {};
    }
  });

  const completionPercentage = result.content?.completion_percentage || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">📊 Steuer-Dashboard</h1>
          <p className="text-slate-500 mt-1">Vollständiger Überblick über Ihre Steuersituation</p>
        </div>
        <div className="flex gap-3">
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AT">🇦🇹 Österreich</SelectItem>
              <SelectItem value="CH">🇨🇭 Schweiz</SelectItem>
              <SelectItem value="DE">🇩🇪 Deutschland</SelectItem>
            </SelectContent>
          </Select>
          <Select value={String(taxYear)} onValueChange={(v) => setTaxYear(parseInt(v))}>
            <SelectTrigger className="w-32">
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

      {isLoading ? (
        <div className="text-center py-12">⏳ Dashboard wird geladen...</div>
      ) : result.content ? (
        <>
          {/* Progress Card */}
          <Card className="border-blue-300 bg-gradient-to-r from-blue-50 to-blue-100">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Gesamtfortschritt</h2>
                <p className="text-3xl font-bold text-blue-600">{Math.round(completionPercentage)}%</p>
              </div>
              <Progress value={completionPercentage} className="h-3" />
            </CardContent>
          </Card>

          {/* KPIs */}
          {(result.content?.kpis || []).length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {result.content.kpis.slice(0, 4).map((kpi, i) => (
                <Card key={i}>
                  <CardContent className="pt-6 text-center">
                    <p className="text-xs text-slate-600">{kpi.name}</p>
                    <p className="text-2xl font-bold text-blue-600 mt-2">
                      {typeof kpi.value === 'number' ? `€${Math.round(kpi.value).toLocaleString()}` : kpi.value}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Critical Actions */}
          {(result.content?.critical_actions || []).length > 0 && (
            <Card className="border-red-300 bg-red-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  🚨 Kritische Maßnahmen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.content.critical_actions.map((action, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded flex gap-2">
                    <span className="text-red-600 font-bold flex-shrink-0">{i + 1}.</span>
                    {action}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Upcoming Deadlines */}
          {(result.content?.upcoming_deadlines || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  📅 Anstehende Termine
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.content.upcoming_deadlines.slice(0, 5).map((deadline, i) => (
                  <div key={i} className="text-sm p-2 bg-slate-50 rounded">
                    • {deadline}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Recommended Optimizations */}
          {(result.content?.optimizations || []).length > 0 && (
            <Card className="border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  ✓ Optimierungsempfehlungen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.content.optimizations.map((opt, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded">
                    • {opt}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Risk Assessment */}
          {result.content?.risk_level && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">🛡️ Risikobewertung</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  <span className="font-bold">Gesamtrisikoniveau: </span>
                  <span className={
                    result.content.risk_level === 'low' ? 'text-green-600' :
                    result.content.risk_level === 'medium' ? 'text-yellow-600' : 'text-red-600'
                  }>{result.content.risk_level}</span>
                </p>
              </CardContent>
            </Card>
          )}
        </>
      ) : null}
    </div>
  );
}