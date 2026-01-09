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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Target } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function TaxForecastPlanner() {
  const [country, setCountry] = useState('DE');
  const [currentIncome, setCurrentIncome] = useState(100000);
  const [growthRate, setGrowthRate] = useState(5);
  const [years, setYears] = useState(3);
  const [forecasting, setForecasting] = useState(false);

  const { data: result = {}, isLoading } = useQuery({
    queryKey: ['taxForecast', country, currentIncome, growthRate, years],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateTaxForecast', {
        country,
        currentIncome,
        growthRate,
        years
      });
      return response.data?.forecast || {};
    },
    enabled: forecasting
  });

  const chartData = (result.content?.projections || []).map(proj => ({
    year: proj.year,
    income: proj.projected_income || 0,
    tax_liability: proj.estimated_tax || 0,
    effective_rate: proj.effective_rate || 0
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📈 Steuer-Prognose-Planer</h1>
        <p className="text-slate-500 mt-1">Planen Sie Ihre zukünftige Steuerlast</p>
      </div>

      {/* Input Controls */}
      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">Prognoseparameter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Land</label>
              <Select value={country} onValueChange={setCountry} disabled={forecasting}>
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
              <label className="text-sm font-medium">Prognose (Jahre)</label>
              <Select value={String(years)} onValueChange={(v) => setYears(parseInt(v))} disabled={forecasting}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Jahr</SelectItem>
                  <SelectItem value="3">3 Jahre</SelectItem>
                  <SelectItem value="5">5 Jahre</SelectItem>
                  <SelectItem value="10">10 Jahre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Aktuelles Einkommen (€)</label>
              <Input
                type="number"
                value={currentIncome}
                onChange={(e) => setCurrentIncome(parseInt(e.target.value) || 0)}
                disabled={forecasting}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Erwartetes Wachstum (%)</label>
              <Input
                type="number"
                value={growthRate}
                onChange={(e) => setGrowthRate(parseFloat(e.target.value) || 0)}
                disabled={forecasting}
                step="0.1"
              />
            </div>
          </div>

          <button
            onClick={() => setForecasting(true)}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:opacity-50"
            disabled={forecasting}
          >
            {forecasting ? '⏳ Wird berechnet...' : 'Prognose erstellen'}
          </button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8">⏳ Prognose wird erstellt...</div>
      ) : forecasting && result.content ? (
        <>
          {/* Metrics Cards */}
          {result.content?.cumulative_tax_liability && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-red-300 bg-red-50">
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-slate-600">Kumulative Steuerlast ({years} Jahre)</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">
                    €{Math.round(result.content.cumulative_tax_liability).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              {result.content?.recommended_savings && (
                <Card className="border-green-300 bg-green-50">
                  <CardContent className="pt-6 text-center">
                    <p className="text-sm text-slate-600">Empfohlene jährliche Ersparnisse</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                      €{Math.round(result.content.recommended_savings).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Forecast Chart */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📊 Finanzielle Prognose</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip formatter={(value) => `€${Math.round(value).toLocaleString()}`} />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="income" stroke="#3b82f6" name="Einkommen" />
                    <Line yAxisId="left" type="monotone" dataKey="tax_liability" stroke="#ef4444" name="Steuerlast" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Projections Table */}
          {(result.content?.projections || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📋 Jahresprojektion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-medium">Jahr</th>
                        <th className="text-right py-2 font-medium">Einkommen</th>
                        <th className="text-right py-2 font-medium">Steuerlast</th>
                        <th className="text-right py-2 font-medium">Satz</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.content.projections.map((proj, i) => (
                        <tr key={i} className="border-b last:border-b-0">
                          <td className="py-2 font-medium">{proj.year}</td>
                          <td className="text-right">€{Math.round(proj.projected_income || 0).toLocaleString()}</td>
                          <td className="text-right font-bold text-red-600">€{Math.round(proj.estimated_tax || 0).toLocaleString()}</td>
                          <td className="text-right">{Math.round((proj.effective_rate || 0) * 100)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Planning Opportunities */}
          {(result.content?.planning_opportunities || []).length > 0 && (
            <Card className="border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle className="text-sm">✓ Planungsgelegenheiten</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.content.planning_opportunities.map((opp, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded">
                    • {opp}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-slate-500">
          Geben Sie die Parameter ein und klicken Sie "Prognose erstellen"
        </div>
      )}
    </div>
  );
}