import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CheckCircle2, TrendingDown } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function MultiCountryTaxComparison() {
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [income, setIncome] = useState('100000');
  const [countries, setCountries] = useState(['AT', 'CH', 'DE']);
  const [compare, setCompare] = useState(false);

  const { data: comparison = {}, isLoading } = useQuery({
    queryKey: ['multiCountryComparison', taxYear, income, countries],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateMultiCountryComparison', {
        taxYear,
        income: parseFloat(income),
        countries
      });
      return response.data?.comparison || {};
    },
    enabled: compare && !!income
  });

  const analysis = comparison.analysis || {};
  
  const chartData = (analysis.countries || []).map(c => ({
    country: c.country,
    'Brutto': income,
    'Steuern': Math.round(c.income_tax + (c.wealth_tax || 0) + (c.social_contributions || 0)),
    'Netto': Math.round(c.net_income)
  }));

  const toggleCountry = (code) => {
    if (countries.includes(code)) {
      setCountries(countries.filter(c => c !== code));
    } else {
      setCountries([...countries, code]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">🌍 Multi-Länder Steuervergleich</h1>
        <p className="text-slate-500 mt-1">Vergleichen Sie Steuerlast in verschiedenen Ländern</p>
      </div>

      {/* Controls */}
      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">Parameter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Jahreseinkommen (€)</label>
              <Input
                type="number"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                placeholder="100000"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Steuerjahr</label>
              <Input
                type="number"
                value={taxYear}
                onChange={(e) => setTaxYear(parseInt(e.target.value))}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Länder auswählen</label>
            <div className="flex gap-2 flex-wrap">
              {['AT', 'CH', 'DE'].map(code => (
                <Button
                  key={code}
                  variant={countries.includes(code) ? 'default' : 'outline'}
                  onClick={() => toggleCountry(code)}
                  className="gap-2"
                >
                  {code === 'AT' && '🇦🇹'}
                  {code === 'CH' && '🇨🇭'}
                  {code === 'DE' && '🇩🇪'}
                  {code}
                </Button>
              ))}
            </div>
          </div>

          <Button
            onClick={() => setCompare(true)}
            disabled={!income || countries.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Vergleich Durchführen
          </Button>
        </CardContent>
      </Card>

      {isLoading && compare && (
        <div className="text-center py-8">⏳ Vergleich wird durchgeführt...</div>
      )}

      {compare && analysis.countries && (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-green-300 bg-green-50">
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600">Günstigstes Land</p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  {analysis.most_favorable || 'N/A'}
                </p>
              </CardContent>
            </Card>
            <Card className="border-blue-300 bg-blue-50">
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600">Sparpotenzial</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">
                  €{Math.round(analysis.savings_potential || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Comparison Chart */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">💰 Steuervergleich</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="country" />
                    <YAxis />
                    <Tooltip formatter={(value) => `€${value.toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="Brutto" fill="#94a3b8" />
                    <Bar dataKey="Steuern" fill="#ef4444" />
                    <Bar dataKey="Netto" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Country Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {analysis.countries.map(country => (
              <Card key={country.country}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm">{country.country}</CardTitle>
                    {country.country === analysis.most_favorable && (
                      <Badge className="bg-green-100 text-green-800">Beste</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-600">Effektiver Steuersatz</p>
                    <p className="text-xl font-bold text-red-600">{Math.round(country.effective_rate || 0)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Nettoeinkommen</p>
                    <p className="text-lg font-bold text-green-600">€{Math.round(country.net_income || 0).toLocaleString()}</p>
                  </div>
                  <div className="text-xs space-y-1">
                    <p>📊 Einkommensteuer: €{Math.round(country.income_tax || 0).toLocaleString()}</p>
                    <p>💼 Sozialabgaben: €{Math.round(country.social_contributions || 0).toLocaleString()}</p>
                    {country.wealth_tax > 0 && (
                      <p>🏦 Vermögensteuer: €{Math.round(country.wealth_tax).toLocaleString()}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Advantages/Disadvantages */}
          {analysis.countries && analysis.countries.length > 0 && (
            analysis.countries.map(country => (
              <Card key={`${country.country}-details`}>
                <CardHeader>
                  <CardTitle className="text-sm">{country.country} - Besonderheiten</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-green-600 mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Vorteile
                    </h4>
                    <div className="space-y-1">
                      {country.advantages?.map((adv, i) => (
                        <p key={i} className="text-sm text-slate-600">✓ {adv}</p>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-red-600 mb-2 flex items-center gap-2">
                      <TrendingDown className="w-4 h-4" />
                      Nachteile
                    </h4>
                    <div className="space-y-1">
                      {country.disadvantages?.map((dis, i) => (
                        <p key={i} className="text-sm text-slate-600">✗ {dis}</p>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          {/* Recommendations */}
          {(analysis.recommendations || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">💡 Empfehlungen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysis.recommendations.map((rec, i) => (
                  <div key={i} className="flex gap-3 p-2 bg-blue-50 rounded text-sm">
                    <span className="text-blue-600 font-bold">{i + 1}.</span>
                    {rec}
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