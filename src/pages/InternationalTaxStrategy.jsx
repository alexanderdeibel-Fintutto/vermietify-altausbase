import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function InternationalTaxStrategy() {
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [income, setIncome] = useState('100000');
  const [selectedCountries, setSelectedCountries] = useState(['AT', 'DE']);
  const [analyze, setAnalyze] = useState(false);

  const { data: strategy = {}, isLoading } = useQuery({
    queryKey: ['internationalTaxStrategy', taxYear, income, selectedCountries],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateInternationalTaxStrategy', {
        countries: selectedCountries,
        taxYear,
        income: parseFloat(income)
      });
      return response.data?.strategy || {};
    },
    enabled: analyze && !!income && selectedCountries.length > 0
  });

  const analysis = strategy.analysis || {};

  const toggleCountry = (code) => {
    if (selectedCountries.includes(code)) {
      setSelectedCountries(selectedCountries.filter(c => c !== code));
    } else {
      setSelectedCountries([...selectedCountries, code]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">🌐 Internationale Steuerstrategie</h1>
        <p className="text-slate-500 mt-1">Optimieren Sie Ihre Steuersituation über Grenzen hinweg</p>
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
            <label className="text-sm font-medium mb-2 block">Tätige Länder</label>
            <div className="space-y-2">
              {['AT', 'CH', 'DE'].map(code => (
                <div key={code} className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedCountries.includes(code)}
                    onCheckedChange={() => toggleCountry(code)}
                    id={code}
                  />
                  <label htmlFor={code} className="cursor-pointer text-sm">
                    {code === 'AT' && '🇦🇹 Österreich'}
                    {code === 'CH' && '🇨🇭 Schweiz'}
                    {code === 'DE' && '🇩🇪 Deutschland'}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={() => setAnalyze(true)}
            disabled={!income || selectedCountries.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Strategie Analysieren
          </Button>
        </CardContent>
      </Card>

      {isLoading && analyze && (
        <div className="text-center py-8">⏳ Strategie wird entwickelt...</div>
      )}

      {analyze && analysis.structure_recommendation && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-red-300 bg-red-50">
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600">Unoptimierte Gesamtsteuer</p>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  €{Math.round(analysis.estimated_total_tax || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card className="border-green-300 bg-green-50">
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600">Sparpotenzial</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  €{Math.round(analysis.potential_savings || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Primary Residence */}
          {analysis.primary_residence && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm font-medium mb-2">Empfohlener Wohnsitz</p>
                <p className="text-lg font-bold">{analysis.primary_residence}</p>
              </CardContent>
            </Card>
          )}

          {/* Structure Recommendation */}
          {analysis.structure_recommendation && (
            <Card className="border-blue-300 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-sm">🏢 Strukturempfehlung</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{analysis.structure_recommendation}</p>
              </CardContent>
            </Card>
          )}

          {/* Risk Level */}
          {analysis.risk_level && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Risiko-Level</span>
                  <Badge className={
                    analysis.risk_level === 'low' ? 'bg-green-100 text-green-800' :
                    analysis.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }>
                    {analysis.risk_level.toUpperCase()}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Treaty Opportunities */}
          {(analysis.treaty_opportunities || []).length > 0 && (
            <Card className="border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle className="text-sm">✅ Abkommens-Möglichkeiten</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysis.treaty_opportunities.map((opp, i) => (
                  <div key={i} className="flex gap-2 text-sm p-2 bg-white rounded">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    {opp}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* PE Risks */}
          {(analysis.pe_risks || []).length > 0 && (
            <Card className="border-yellow-300 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  Betriebsstättaten-Risiken
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysis.pe_risks.map((risk, i) => (
                  <div key={i} className="flex gap-2 text-sm p-2 bg-white rounded">
                    <span className="text-yellow-600 font-bold">!</span>
                    {risk}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Filing Requirements */}
          {(analysis.filing_requirements || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📋 Einreichungsanforderungen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysis.filing_requirements.map((req, i) => (
                  <div key={i} className="flex gap-2 text-sm p-2 bg-slate-50 rounded">
                    <span className="text-blue-600 font-bold">→</span>
                    {req}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Action Items */}
          {(analysis.action_items || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">⚡ Maßnahmen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysis.action_items.map((action, i) => (
                  <div key={i} className="flex gap-3 p-2 bg-slate-50 rounded text-sm">
                    <span className="font-bold text-blue-600 flex-shrink-0">{i + 1}.</span>
                    {action}
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