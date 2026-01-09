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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingDown, Star } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function TaxScenarioComparison() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [comparing, setComparing] = useState(false);

  const { data: comparison = {}, isLoading } = useQuery({
    queryKey: ['taxScenarioComparison', country, taxYear],
    queryFn: async () => {
      const response = await base44.functions.invoke('compareMultipleTaxScenarios', {
        country,
        taxYear
      });
      return response.data?.comparison || {};
    },
    enabled: comparing
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📊 Steuerszenarien Vergleich</h1>
        <p className="text-slate-500 mt-1">Vergleichen Sie mehrere Steuerplanungsszenarien</p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <label className="text-sm font-medium">Steuerjahr</label>
          <Select value={String(taxYear)} onValueChange={(v) => setTaxYear(parseInt(v))} disabled={comparing}>
            <SelectTrigger>
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

      <button
        onClick={() => setComparing(true)}
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:opacity-50"
        disabled={comparing}
      >
        {comparing ? '⏳ Wird verglichen...' : 'Szenarios vergleichen'}
      </button>

      {isLoading ? (
        <div className="text-center py-8">⏳ Vergleich läuft...</div>
      ) : comparing && comparison.content ? (
        <>
          {/* Scenario Count */}
          <Card className="border-blue-300 bg-blue-50">
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-slate-600">Analysierte Szenarien</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{comparison.scenario_count}</p>
            </CardContent>
          </Card>

          {/* Scenario Rankings */}
          {(comparison.content?.scenario_rankings || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">🏆 Szenario-Rankings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {comparison.content.scenario_rankings.map((scenario, i) => (
                  <div key={i} className="border-l-4 border-blue-300 pl-3 py-2 bg-blue-50 p-3 rounded">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">{i + 1}. {scenario.name}</p>
                        <p className="text-xs text-slate-600 mt-1">{scenario.description}</p>
                      </div>
                      {i === 0 && <Star className="w-5 h-5 text-yellow-400 flex-shrink-0" />}
                    </div>
                    {scenario.estimated_savings && (
                      <p className="text-xs font-bold text-green-600 mt-1">
                        Einsparungen: €{Math.round(scenario.estimated_savings).toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Recommendation */}
          {comparison.content?.recommendation && (
            <Card className="border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" />
                  ✓ Empfohlenes Szenario
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{comparison.content.recommendation}</p>
              </CardContent>
            </Card>
          )}

          {/* Hybrid Approach */}
          {comparison.content?.hybrid_approach && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">🔄 Hybridansatz</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{comparison.content.hybrid_approach}</p>
              </CardContent>
            </Card>
          )}

          {/* Summary Table */}
          {(comparison.content?.summary_table || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📋 Vergleichstabelle</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-medium">Szenario</th>
                        <th className="text-right py-2 font-medium">Steuerbetrag</th>
                        <th className="text-right py-2 font-medium">Einsparungen</th>
                        <th className="text-center py-2 font-medium">Komplexität</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparison.content.summary_table.map((row, i) => (
                        <tr key={i} className="border-b last:border-b-0">
                          <td className="py-2">{row.name || row.scenario}</td>
                          <td className="text-right">€{Math.round(row.tax_amount || 0).toLocaleString()}</td>
                          <td className="text-right text-green-600 font-bold">
                            €{Math.round(row.savings || 0).toLocaleString()}
                          </td>
                          <td className="text-center">{row.complexity || 'Mittel'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-slate-500">
          Klicken Sie "Szenarios vergleichen", um Ihre Steuerszenarien zu analysieren
        </div>
      )}
    </div>
  );
}