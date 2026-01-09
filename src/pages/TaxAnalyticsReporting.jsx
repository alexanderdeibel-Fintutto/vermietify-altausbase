import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { TrendingUp, Zap } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function TaxAnalyticsReporting() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [analyzing, setAnalyzing] = useState(false);

  const { data: report = {}, isLoading } = useQuery({
    queryKey: ['taxAnalytics', country, taxYear],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateTaxAnalyticsReport', {
        country,
        taxYear
      });
      return response.data?.report || {};
    },
    enabled: analyzing
  });

  const deductionData = (report.content?.deduction_breakdown || []).map((item, idx) => ({
    name: item.name,
    value: item.amount || 0,
    color: COLORS[idx % COLORS.length]
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📊 Steuer-Analytik & Berichterstattung</h1>
        <p className="text-slate-500 mt-1">Detaillierte Analyse Ihrer Steuerdaten</p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium">Land</label>
          <Select value={country} onValueChange={setCountry} disabled={analyzing}>
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
          <Select value={String(taxYear)} onValueChange={(v) => setTaxYear(parseInt(v))} disabled={analyzing}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR].map(year => (
                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <button
          onClick={() => setAnalyzing(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:opacity-50"
          disabled={analyzing}
        >
          {analyzing ? '⏳...' : 'Analysieren'}
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">⏳ Analyse läuft...</div>
      ) : analyzing && report.content ? (
        <>
          {/* Efficiency Metrics */}
          {report.content?.efficiency_metrics && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📈 Effizienzmetriken</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(report.content.efficiency_metrics).slice(0, 3).map(([key, value]) => (
                    <div key={key} className="text-center p-3 bg-slate-50 rounded">
                      <p className="text-xs text-slate-600 capitalize">{key.replace(/_/g, ' ')}</p>
                      <p className="text-lg font-bold text-blue-600 mt-1">
                        {typeof value === 'number' ? `${Math.round(value)}%` : value}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Deduction Breakdown Chart */}
          {deductionData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">💰 Abzugsaufschlüsselung</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={deductionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: €${Math.round(value)}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {deductionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `€${Math.round(value)}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Key Metrics */}
          {(report.content?.key_metrics || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">🎯 Wichtige Kennzahlen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {report.content.key_metrics.map((metric, i) => (
                  <div key={i} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                    <span className="text-sm font-medium">{metric.name}</span>
                    <span className="text-sm font-bold text-blue-600">
                      {typeof metric.value === 'number' ? `€${Math.round(metric.value).toLocaleString()}` : metric.value}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Optimization Opportunities */}
          {(report.content?.optimization_opportunities || []).length > 0 && (
            <Card className="border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  ✓ Optimierungsmöglichkeiten
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {report.content.optimization_opportunities.map((opp, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded">
                    • {opp}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Savings Potential */}
          {report.content?.savings_potential && (
            <Card className="border-green-300 bg-green-50">
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-slate-600">Gesamtsparpotenzial</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  €{Math.round(report.content.savings_potential).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-slate-500">
          Wählen Sie Jahr und Land, klicken Sie "Analysieren"
        </div>
      )}
    </div>
  );
}