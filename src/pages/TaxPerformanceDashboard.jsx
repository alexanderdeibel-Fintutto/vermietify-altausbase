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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function TaxPerformanceDashboard() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);

  const { data: dashboard = {}, isLoading } = useQuery({
    queryKey: ['taxPerformanceDashboard', country, taxYear],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateTaxPerformanceDashboard', {
        country,
        taxYear
      });
      return response.data?.dashboard || {};
    }
  });

  const kpiData = dashboard.content?.kpis ? 
    Object.entries(dashboard.content.kpis).map(([key, value]) => ({
      name: key.replace(/_/g, ' '),
      value: typeof value === 'number' ? Math.round(value) : value
    })) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📊 Steuer-Performance Dashboard</h1>
        <p className="text-slate-500 mt-1">Übersicht aller wichtigen Steuerkennzahlen</p>
      </div>

      {/* Filters */}
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
              {[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map(year => (
                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">⏳ Dashboard wird geladen...</div>
      ) : dashboard.content ? (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-slate-600">Gesamtsteuerbetrag</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">
                  €{Math.round(dashboard.metrics.total_tax).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-slate-600">Dokumentation</p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  {dashboard.metrics.documents_count}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-slate-600">Compliance Rate</p>
                <p className="text-2xl font-bold text-purple-600 mt-2">
                  {dashboard.metrics.compliance_rate}%
                </p>
              </CardContent>
            </Card>
            <Card className="border-blue-300 bg-blue-50">
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-slate-600">Land</p>
                <p className="text-lg font-bold text-blue-600 mt-2">
                  {country === 'AT' ? '🇦🇹 AT' : country === 'CH' ? '🇨🇭 CH' : '🇩🇪 DE'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* KPI Chart */}
          {kpiData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📈 Leistungskennzahlen</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={kpiData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Progress Metrics */}
          {dashboard.content.progress_metrics && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📊 Fortschrittsmetriken</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(dashboard.content.progress_metrics).map(([key, value]) => (
                  <div key={key}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm capitalize font-medium">{key.replace(/_/g, ' ')}</span>
                      <span className="text-sm font-bold">{typeof value === 'number' ? Math.round(value) : value}%</span>
                    </div>
                    <Progress value={typeof value === 'number' ? value : 0} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Risk Indicators */}
          {(dashboard.content.risk_indicators || []).length > 0 && (
            <Card className="border-orange-300 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  ⚠️ Risikoindikatoren
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {dashboard.content.risk_indicators.map((risk, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded">
                    <p className="font-medium">{risk.name || risk.type}</p>
                    <p className="text-xs text-slate-600 mt-1">{risk.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Completion Status */}
          {dashboard.content.completion_status && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">✓ Fertigstellungsstatus</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(dashboard.content.completion_status).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                    <span className="text-sm capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="flex items-center gap-2">
                      {typeof value === 'number' ? (
                        <>
                          <span className="text-sm font-bold">{Math.round(value)}%</span>
                          {value >= 80 && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                        </>
                      ) : (
                        <span className="text-sm font-bold">{value}</span>
                      )}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Next Actions */}
          {(dashboard.content.next_actions || []).length > 0 && (
            <Card className="border-blue-300 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  📋 Nächste Aktionen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {dashboard.content.next_actions.map((action, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded flex gap-2">
                    <span className="text-blue-600 font-bold flex-shrink-0">{i + 1}.</span>
                    {action}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-slate-500">
          Dashboard wird geladen...
        </div>
      )}
    </div>
  );
}