import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingDown, Globe, DollarSign, TrendingUp } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();
const COLORS = ['#ef4444', '#f59e0b', '#10b981'];

export default function InternationalTaxComparison() {
  const [scenario, setScenario] = useState({
    income: 100000,
    investments: 50000,
    wealth: 500000,
    taxYear: CURRENT_YEAR
  });

  // Generate comparison
  const { data: comparison, isLoading, mutate } = useMutation({
    mutationFn: () => base44.functions.invoke('generateInternationalTaxComparison', { scenario })
  });

  const handleCalculate = () => {
    mutate();
  };

  const chartData = comparison?.sorted_by_efficiency?.map(item => ({
    country: item.country,
    name: item.country_name,
    tax: Math.round(item.total_tax),
    effective_rate: parseFloat(item.effective_rate)
  })) || [];

  const pieData = comparison?.sorted_by_efficiency?.map(item => ({
    name: item.country_name,
    value: Math.round(item.total_tax)
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">🌍 International Tax Comparison</h1>
        <p className="text-slate-500 mt-1">Vergleichen Sie Ihre Steuerlast in Deutschland, Österreich & Schweiz</p>
      </div>

      {/* Input Scenario */}
      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" /> Szenario konfigurieren
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Jährliches Einkommen (€)</label>
              <Input
                type="number"
                value={scenario.income}
                onChange={(e) => setScenario({ ...scenario, income: parseFloat(e.target.value) })}
                className="mt-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Investitionen (€)</label>
              <Input
                type="number"
                value={scenario.investments}
                onChange={(e) => setScenario({ ...scenario, investments: parseFloat(e.target.value) })}
                className="mt-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Vermögen (€)</label>
              <Input
                type="number"
                value={scenario.wealth}
                onChange={(e) => setScenario({ ...scenario, wealth: parseFloat(e.target.value) })}
                className="mt-2"
              />
            </div>
          </div>
          <Button onClick={handleCalculate} className="w-full bg-blue-600 hover:bg-blue-700 gap-2">
            <TrendingDown className="w-4 h-4" /> Vergleichen
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8">⏳ Berechne Vergleich...</div>
      ) : comparison?.comparisons ? (
        <>
          {/* Savings Analysis */}
          {comparison.savings_analysis && (
            <Card className="border-green-300 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-600">💰 Potenzielle Einsparungen</p>
                    <p className="text-4xl font-bold text-green-600 mt-2">
                      {comparison.savings_analysis.potential_savings.toLocaleString('de-DE')}€
                    </p>
                    <p className="text-sm text-slate-700 mt-2">
                      Von <strong>{comparison.savings_analysis.least_efficient.country_name}</strong> zu{' '}
                      <strong>{comparison.savings_analysis.most_efficient.country_name}</strong>
                    </p>
                  </div>
                  <div className="text-right text-3xl">🎯</div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📊 Steuerlast nach Land</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="country" />
                    <YAxis />
                    <Tooltip formatter={(value) => `€${value.toLocaleString()}`} />
                    <Bar dataKey="tax" fill="#ef4444" name="Steuerbetrag" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📈 Vergleich Steuerlast</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: €${value.toLocaleString()}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `€${value.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Country Details */}
          <div className="space-y-4">
            {comparison.sorted_by_efficiency.map((item, idx) => {
              const countryData = comparison.comparisons[item.country];
              return (
                <Card
                  key={item.country}
                  className={
                    idx === 0
                      ? 'border-green-300 bg-green-50'
                      : idx === 1
                      ? 'border-yellow-300 bg-yellow-50'
                      : 'border-red-300 bg-red-50'
                  }
                >
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">
                            {item.country === 'AT' ? '🇦🇹' : item.country === 'CH' ? '🇨🇭' : '🇩🇪'}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">{item.country_name}</h3>
                            <p className="text-sm text-slate-600">
                              Steuerlast: €{item.tax.toLocaleString('de-DE')} ({item.effective_rate}% effektiv)
                            </p>
                          </div>
                        </div>
                        {idx === 0 && <Badge className="bg-green-600 text-white gap-1">✓ Optimal</Badge>}
                      </div>

                      {/* Tax Breakdown */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div className="bg-white p-2 rounded">
                          <p className="text-slate-600">Einkommensteuer</p>
                          <p className="font-semibold">€{Math.round(countryData.calculation.income_tax).toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-2 rounded">
                          <p className="text-slate-600">Kapitalertragsteuer</p>
                          <p className="font-semibold">€{Math.round(countryData.calculation.capital_gains_tax).toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-2 rounded">
                          <p className="text-slate-600">Vermögenssteuer</p>
                          <p className="font-semibold">€{Math.round(countryData.calculation.wealth_tax).toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-2 rounded border-2 border-blue-300">
                          <p className="text-slate-600">Gesamt</p>
                          <p className="font-bold text-blue-600">€{Math.round(countryData.calculation.total_tax).toLocaleString()}</p>
                        </div>
                      </div>

                      {/* Advantages & Disadvantages */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-semibold text-green-700 mb-2">✅ Vorteile</p>
                          <ul className="text-xs space-y-1">
                            {countryData.advantages.map((adv, i) => (
                              <li key={i}>• {adv}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-red-700 mb-2">⚠️ Nachteile</p>
                          <ul className="text-xs space-y-1">
                            {countryData.disadvantages.map((dis, i) => (
                              <li key={i}>• {dis}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Planning Tips */}
                      <div className="bg-white p-3 rounded border-l-4 border-blue-500">
                        <p className="text-xs font-semibold text-blue-700 mb-2">💡 Optimierungstipps</p>
                        <ul className="text-xs space-y-1">
                          {countryData.planning_tips.map((tip, i) => (
                            <li key={i}>• {tip}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Recommendation */}
          <Card className="border-blue-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" /> Empfehlung
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700">{comparison.recommendation}</p>
              <p className="text-sm text-slate-600 mt-3">
                ℹ️ Diese Analyse basiert auf vereinfachten Annahmen. Konsultieren Sie einen qualifizierten Steuerberater für Ihre spezifische Situation.
              </p>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}