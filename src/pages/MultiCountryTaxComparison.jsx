import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingDown } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function MultiCountryTaxComparison() {
  const [selectedCountries, setSelectedCountries] = useState(['DE', 'AT']);
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [income, setIncome] = useState(100000);
  const [comparing, setComparing] = useState(false);

  const { data: comparison = {}, isLoading } = useQuery({
    queryKey: ['multiCountryComparison', selectedCountries, taxYear, income],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateMultiCountryComparison', {
        countries: selectedCountries,
        taxYear,
        income
      });
      return response.data?.comparison || {};
    },
    enabled: comparing
  });

  const toggleCountry = (country) => {
    if (selectedCountries.includes(country)) {
      setSelectedCountries(selectedCountries.filter(c => c !== country));
    } else {
      setSelectedCountries([...selectedCountries, country]);
    }
  };

  const chartData = selectedCountries.map(country => ({
    country: country === 'AT' ? 'Österreich' : country === 'CH' ? 'Schweiz' : 'Deutschland',
    code: country,
    rate: comparison.analysis?.effective_rates?.[country] || 0,
    liability: comparison.analysis?.tax_liabilities?.[country] || 0
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">🌍 Multi-Land Steuervergleich</h1>
        <p className="text-slate-500 mt-1">Vergleichen Sie Steuern über Länder hinweg</p>
      </div>

      {/* Controls */}
      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">Vergleich konfigurieren</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Countries */}
          <div>
            <label className="text-sm font-medium">Länder auswählen</label>
            <div className="flex gap-2 mt-2">
              {['AT', 'CH', 'DE'].map(country => (
                <Badge
                  key={country}
                  variant={selectedCountries.includes(country) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleCountry(country)}
                >
                  {country === 'AT' ? '🇦🇹' : country === 'CH' ? '🇨🇭' : '🇩🇪'} {country}
                </Badge>
              ))}
            </div>
          </div>

          {/* Income */}
          <div>
            <label className="text-sm font-medium">Jährliches Einkommen (€)</label>
            <Input
              type="number"
              value={income}
              onChange={(e) => setIncome(parseInt(e.target.value))}
              className="mt-1"
              disabled={comparing}
            />
          </div>

          {/* Tax Year */}
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

          <Button
            onClick={() => setComparing(true)}
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={comparing || selectedCountries.length === 0}
          >
            Vergleichen
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8">⏳ Vergleich wird erstellt...</div>
      ) : comparing && comparison.analysis ? (
        <>
          {/* Tax Chart */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📊 Steuerschuld Vergleich</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="country" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="liability" fill="#ef4444" name="Steuerschuld (€)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Effective Tax Rates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">📈 Effektive Steuersätze</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {selectedCountries.map(country => (
                <div key={country} className="border-l-4 border-blue-300 pl-3">
                  <p className="text-sm text-slate-600">
                    {country === 'AT' ? 'Österreich' : country === 'CH' ? 'Schweiz' : 'Deutschland'}
                  </p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {Math.round((comparison.analysis?.effective_rates?.[country] || 0) * 100) / 100}%
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    €{Math.round(comparison.analysis?.tax_liabilities?.[country] || 0).toLocaleString()}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Best Jurisdiction */}
          {comparison.analysis?.best_jurisdiction && (
            <Card className="border-green-300 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Beste Jurisdiktion</p>
                    <p className="text-lg font-bold text-green-600 mt-1">
                      {comparison.analysis.best_jurisdiction}
                    </p>
                  </div>
                  <TrendingDown className="w-10 h-10 text-green-300" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Deduction Opportunities */}
          {comparison.analysis?.deduction_opportunities && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">💡 Abzugsmöglichkeiten</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(comparison.analysis.deduction_opportunities).map(([country, deductions]) => (
                  <div key={country}>
                    <p className="text-sm font-medium mb-2">
                      {country === 'AT' ? '🇦🇹 Österreich' : country === 'CH' ? '🇨🇭 Schweiz' : '🇩🇪 Deutschland'}
                    </p>
                    <ul className="space-y-1 ml-2">
                      {deductions.map((deduction, i) => (
                        <li key={i} className="text-xs p-1 bg-slate-50 rounded">
                          • {deduction}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Optimization Recommendations */}
          {(comparison.analysis?.optimization_recommendations || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📋 Optimierungsempfehlungen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {comparison.analysis.optimization_recommendations.map((rec, i) => (
                  <div key={i} className="text-sm p-2 bg-blue-50 rounded flex gap-2">
                    <span className="text-blue-600 font-bold flex-shrink-0">{i + 1}.</span>
                    {rec}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-slate-500">
          Wählen Sie Länder aus und klicken Sie "Vergleichen"
        </div>
      )}
    </div>
  );
}