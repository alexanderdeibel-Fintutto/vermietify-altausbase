import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingDown, AlertTriangle, Trophy } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function MultiCountryTaxComparison() {
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);

  const { data: comparison = {}, isLoading } = useQuery({
    queryKey: ['multiCountryComparison', taxYear],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateMultiCountryComparison', {
        taxYear
      });
      return response.data?.comparison || {};
    }
  });

  const comparisonData = [
    { country: 'Austria', tax: comparison.countries?.AT?.total_tax || 0 },
    { country: 'Switzerland', tax: comparison.countries?.CH?.total_tax || 0 },
    { country: 'Germany', tax: comparison.countries?.DE?.total_tax || 0 }
  ];

  const sortedByTax = [...comparisonData].sort((a, b) => a.tax - b.tax);
  const minTax = sortedByTax[0];
  const maxTax = sortedByTax[2];
  const savings = maxTax.tax - minTax.tax;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">🌍 Multi-Country Tax Comparison</h1>
        <p className="text-slate-500 mt-1">Vergleichen Sie Ihre Steuerlast in AT, CH & DE</p>
      </div>

      {/* Controls */}
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

      {isLoading ? (
        <div className="text-center py-8">⏳ Lade Vergleich...</div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-green-300 bg-green-50">
              <CardContent className="pt-6 text-center">
                <Trophy className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-slate-600">Günstigster</p>
                <p className="text-2xl font-bold text-green-600 mt-2">{minTax.country}</p>
                <p className="text-sm mt-1">€{Math.round(minTax.tax).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="border-red-300 bg-red-50">
              <CardContent className="pt-6 text-center">
                <AlertTriangle className="w-6 h-6 text-red-600 mx-auto mb-2" />
                <p className="text-sm text-slate-600">Höchster</p>
                <p className="text-2xl font-bold text-red-600 mt-2">{maxTax.country}</p>
                <p className="text-sm mt-1">€{Math.round(maxTax.tax).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="border-blue-300 bg-blue-50">
              <CardContent className="pt-6 text-center">
                <TrendingDown className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-slate-600">Differenz</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">€{Math.round(savings).toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>

          {/* Comparison Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">📊 Steuerlast-Vergleich</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="country" />
                  <YAxis />
                  <Tooltip formatter={(value) => `€${value.toLocaleString()}`} />
                  <Bar dataKey="tax" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Ranking */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">🏆 Ranking nach Steuerlast</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {sortedByTax.map((item, idx) => (
                <div key={item.country} className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-200">
                  <div className="flex items-center gap-3">
                    <Badge className={`text-lg px-2.5 py-1 ${
                      idx === 0 ? 'bg-green-100 text-green-800' :
                      idx === 1 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {idx + 1}
                    </Badge>
                    <p className="font-medium">{item.country}</p>
                  </div>
                  <p className="text-lg font-bold">€{Math.round(item.tax).toLocaleString()}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Advantages */}
          {comparison.analysis?.advantages && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(comparison.analysis.advantages).map(([country, advantages]) => (
                <Card key={country}>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      {country === 'austria' && '🇦🇹 Österreich'}
                      {country === 'switzerland' && '🇨🇭 Schweiz'}
                      {country === 'germany' && '🇩🇪 Deutschland'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {(advantages || []).map((adv, i) => (
                        <li key={i} className="text-xs text-slate-700 flex gap-1">
                          <span>✓</span> {adv}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Opportunities */}
          {(comparison.analysis?.opportunities || []).length > 0 && (
            <Card className="border-blue-300 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-sm">💡 Optimierungsmöglichkeiten</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {comparison.analysis.opportunities.map((opp, i) => (
                    <li key={i} className="text-sm flex gap-2">
                      <Badge className="flex-shrink-0 bg-blue-200 text-blue-800 text-xs mt-0.5">
                        {i + 1}
                      </Badge>
                      {opp}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {(comparison.analysis?.recommendations || []).length > 0 && (
            <Alert className="border-green-300 bg-green-50">
              <AlertDescription className="text-green-900 text-sm space-y-2">
                <strong>✅ Empfehlungen:</strong>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  {comparison.analysis.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </>
      )}
    </div>
  );
}