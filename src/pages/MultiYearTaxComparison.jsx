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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function MultiYearTaxComparison() {
  const [country, setCountry] = useState('DE');
  const [startYear, setStartYear] = useState(CURRENT_YEAR - 2);
  const [endYear, setEndYear] = useState(CURRENT_YEAR);
  const [comparing, setComparing] = useState(false);

  const { data: result = {}, isLoading } = useQuery({
    queryKey: ['multiYearComparison', country, startYear, endYear],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateMultiYearTaxComparison', {
        country,
        startYear,
        endYear
      });
      return response.data?.comparison || {};
    },
    enabled: comparing
  });

  const chartData = (result.content?.year_summary || []).map(year => ({
    year: year.year,
    tax_liability: year.tax_liability || 0,
    income: year.income || 0,
    deductions: year.deductions || 0
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📊 Mehrjahres-Steuer-Vergleich</h1>
        <p className="text-slate-500 mt-1">Verfolgen Sie Ihre Steuertrendana über mehrere Jahre</p>
      </div>

      {/* Controls */}
      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">Vergleichszeitraum</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Land</label>
              <Select value={country} onValueChange={setCountry} disabled={comparing}>
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
              <label className="text-sm font-medium">Von Jahr</label>
              <Select value={String(startYear)} onValueChange={(v) => setStartYear(parseInt(v))} disabled={comparing}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[CURRENT_YEAR - 4, CURRENT_YEAR - 3, CURRENT_YEAR - 2, CURRENT_YEAR - 1].map(year => (
                    <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Bis Jahr</label>
              <Select value={String(endYear)} onValueChange={(v) => setEndYear(parseInt(v))} disabled={comparing}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[startYear + 1, CURRENT_YEAR - 1, CURRENT_YEAR].map(year => (
                    <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setComparing(true)}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:opacity-50"
                disabled={comparing}
              >
                Vergleichen
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8">⏳ Vergleich läuft...</div>
      ) : comparing && result.content ? (
        <>
          {/* Period Info */}
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-slate-600">Analysierter Zeitraum</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">{result.year_count} Jahre</p>
            </CardContent>
          </Card>

          {/* Trends Chart */}
          {chartData.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📈 Steuer-Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip formatter={(value) => `€${Math.round(value).toLocaleString()}`} />
                    <Legend />
                    <Line type="monotone" dataKey="tax_liability" stroke="#ef4444" name="Steuerlast" />
                    <Line type="monotone" dataKey="income" stroke="#3b82f6" name="Einkommen" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Year Summary Table */}
          {(result.content?.year_summary || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📋 Jahresübersicht</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-medium">Jahr</th>
                        <th className="text-right py-2 font-medium">Einkommen</th>
                        <th className="text-right py-2 font-medium">Abzüge</th>
                        <th className="text-right py-2 font-medium">Steuerlast</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.content.year_summary.map((year, i) => (
                        <tr key={i} className="border-b last:border-b-0">
                          <td className="py-2 font-medium">{year.year}</td>
                          <td className="text-right">€{Math.round(year.income || 0).toLocaleString()}</td>
                          <td className="text-right">€{Math.round(year.deductions || 0).toLocaleString()}</td>
                          <td className="text-right font-bold text-red-600">€{Math.round(year.tax_liability || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Key Changes */}
          {(result.content?.key_changes || []).length > 0 && (
            <Card className="border-orange-300 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-sm">📌 Wichtige Änderungen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.content.key_changes.map((change, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded">
                    • {change}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Growth Metrics */}
          {result.content?.growth_metrics && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📊 Wachstumsmetriken</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.entries(result.content.growth_metrics).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center py-2 border-b last:border-b-0">
                    <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className={`font-bold ${value >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {value >= 0 ? '+' : ''}{Number(value).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {(result.content?.recommendations || []).length > 0 && (
            <Card className="border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle className="text-sm">✓ Empfehlungen basierend auf Trends</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.content.recommendations.map((rec, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded flex gap-2">
                    <span className="text-green-600 font-bold flex-shrink-0">{i + 1}.</span>
                    {rec}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-slate-500">
          Wählen Sie einen Zeitraum und klicken Sie "Vergleichen"
        </div>
      )}
    </div>
  );
}