import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { AlertTriangle, TrendingDown, TrendingUp, CheckCircle2 } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function TaxScenarioSimulator() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [scenarios, setScenarios] = useState([
    {
      name: 'Basis-Szenario',
      base_income: 80000,
      base_investments: 10000,
      adjusted_income: 80000,
      adjusted_investments: 10000,
      wealth: 200000
    },
    {
      name: 'Optimiert',
      base_income: 80000,
      base_investments: 10000,
      adjusted_income: 70000,
      adjusted_investments: 15000,
      wealth: 200000
    }
  ]);
  const [activeScenarioIndex, setActiveScenarioIndex] = useState(0);
  const [results, setResults] = useState({});

  const { mutate: simulateScenario, isLoading } = useMutation({
    mutationFn: (scenarioData) =>
      base44.functions.invoke('simulateTaxScenario', { scenario: scenarioData })
  });

  const handleSimulate = (index) => {
    const scenario = scenarios[index];
    simulateScenario(
      {
        country,
        taxYear,
        parameters: {
          base_income: scenario.base_income,
          base_investments: scenario.base_investments,
          adjusted_income: scenario.adjusted_income,
          adjusted_investments: scenario.adjusted_investments,
          wealth: scenario.wealth
        }
      },
      {
        onSuccess: (response) => {
          setResults(prev => ({
            ...prev,
            [index]: response.data
          }));
        }
      }
    );
  };

  const handleAddScenario = () => {
    setScenarios([
      ...scenarios,
      {
        name: `Szenario ${scenarios.length + 1}`,
        base_income: 80000,
        base_investments: 10000,
        adjusted_income: 80000,
        adjusted_investments: 10000,
        wealth: 200000
      }
    ]);
  };

  const handleUpdateScenario = (index, field, value) => {
    const newScenarios = [...scenarios];
    newScenarios[index] = { ...newScenarios[index], [field]: value };
    setScenarios(newScenarios);
  };

  const currentResult = results[activeScenarioIndex];
  const allResults = scenarios.map((_, i) => results[i]).filter(Boolean);

  const comparisonData = allResults.map((result, i) => ({
    scenario: scenarios[i].name,
    tax: Math.round(result.adjusted_calculation.total),
    savings: Math.round(result.base_calculation.total - result.adjusted_calculation.total)
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">🎯 Tax Scenario Simulator</h1>
        <p className="text-slate-500 mt-1">Modellieren Sie verschiedene Steueroptimierungsszenarien</p>
      </div>

      {/* Controls */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 max-w-xs">
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

        <div className="pt-6">
          <Button onClick={handleAddScenario} className="bg-blue-600 hover:bg-blue-700 gap-2">
            + Szenario hinzufügen
          </Button>
        </div>
      </div>

      {/* Scenario Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {scenarios.map((scenario, idx) => (
          <button
            key={idx}
            onClick={() => setActiveScenarioIndex(idx)}
            className={`px-4 py-2 rounded whitespace-nowrap transition-all ${
              idx === activeScenarioIndex
                ? 'bg-blue-600 text-white'
                : 'bg-slate-200 hover:bg-slate-300'
            }`}
          >
            {scenario.name}
          </button>
        ))}
      </div>

      {/* Scenario Editor */}
      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">⚙️ Szenario konfigurieren: {scenarios[activeScenarioIndex].name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Szenario Name</label>
            <Input
              value={scenarios[activeScenarioIndex].name}
              onChange={(e) => handleUpdateScenario(activeScenarioIndex, 'name', e.target.value)}
              className="mt-2"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Basis-Einkommen (€)</label>
              <Input
                type="number"
                value={scenarios[activeScenarioIndex].base_income}
                onChange={(e) => handleUpdateScenario(activeScenarioIndex, 'base_income', parseFloat(e.target.value))}
                className="mt-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Basis-Investitionen (€)</label>
              <Input
                type="number"
                value={scenarios[activeScenarioIndex].base_investments}
                onChange={(e) => handleUpdateScenario(activeScenarioIndex, 'base_investments', parseFloat(e.target.value))}
                className="mt-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Vermögen (€)</label>
              <Input
                type="number"
                value={scenarios[activeScenarioIndex].wealth}
                onChange={(e) => handleUpdateScenario(activeScenarioIndex, 'wealth', parseFloat(e.target.value))}
                className="mt-2"
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="font-semibold mb-3">Nach Optimierung</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Optimiertes Einkommen (€)</label>
                <Input
                  type="number"
                  value={scenarios[activeScenarioIndex].adjusted_income}
                  onChange={(e) => handleUpdateScenario(activeScenarioIndex, 'adjusted_income', parseFloat(e.target.value))}
                  className="mt-2"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Optimierte Investitionen (€)</label>
                <Input
                  type="number"
                  value={scenarios[activeScenarioIndex].adjusted_investments}
                  onChange={(e) => handleUpdateScenario(activeScenarioIndex, 'adjusted_investments', parseFloat(e.target.value))}
                  className="mt-2"
                />
              </div>
            </div>
          </div>

          <Button
            onClick={() => handleSimulate(activeScenarioIndex)}
            className="w-full bg-green-600 hover:bg-green-700 gap-2"
            disabled={isLoading}
          >
            {isLoading ? '⏳ Simuliere...' : '🚀 Szenario simulieren'}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {currentResult && (
        <>
          {/* Risk Alert */}
          {currentResult.risk_level !== 'low' && (
            <Alert className={`border-${currentResult.risk_level === 'high' ? 'red' : 'yellow'}-300 bg-${currentResult.risk_level === 'high' ? 'red' : 'yellow'}-50`}>
              <AlertTriangle className={`h-4 w-4 text-${currentResult.risk_level === 'high' ? 'red' : 'yellow'}-600`} />
              <AlertDescription className={`text-${currentResult.risk_level === 'high' ? 'red' : 'yellow'}-900`}>
                <strong>Risiko-Warnung:</strong> {currentResult.risk_level === 'high' ? 'Hohes' : 'Mittleres'} Revisionsrisiko erkannt
              </AlertDescription>
            </Alert>
          )}

          {/* Impact Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-slate-600">Basis-Steuerlast</p>
                <p className="text-2xl font-bold mt-2">€{Math.round(currentResult.base_calculation.total).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-slate-600">Optimierte Steuerlast</p>
                <p className="text-2xl font-bold mt-2">€{Math.round(currentResult.adjusted_calculation.total).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="border-green-300 bg-green-50">
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-slate-600">💰 Einsparungen</p>
                <p className="text-2xl font-bold text-green-600 mt-2">€{Math.round(currentResult.impact.tax_change).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-slate-600">Machbarkeits-Score</p>
                <p className="text-2xl font-bold mt-2">{currentResult.feasibility_score}%</p>
                <Badge className="mt-2 w-full justify-center">
                  {currentResult.risk_level === 'low' ? '✅ Niedrig' : currentResult.risk_level === 'medium' ? '⚠️ Mittel' : '🔴 Hoch'}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">📊 Steuer-Aufschlüsselung</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold mb-2">Basis-Szenario</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Einkommensteuer:</span>
                      <span>€{Math.round(currentResult.base_calculation.income_tax).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kapitalertragsteuer:</span>
                      <span>€{Math.round(currentResult.base_calculation.capital_gains_tax).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Vermögenssteuer:</span>
                      <span>€{Math.round(currentResult.base_calculation.wealth_tax).toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-1 font-bold flex justify-between">
                      <span>Summe:</span>
                      <span>€{Math.round(currentResult.base_calculation.total).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="font-semibold mb-2">Optimiertes Szenario</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Einkommensteuer:</span>
                      <span>€{Math.round(currentResult.adjusted_calculation.income_tax).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kapitalertragsteuer:</span>
                      <span>€{Math.round(currentResult.adjusted_calculation.capital_gains_tax).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Vermögenssteuer:</span>
                      <span>€{Math.round(currentResult.adjusted_calculation.wealth_tax).toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-1 font-bold flex justify-between text-green-600">
                      <span>Summe:</span>
                      <span>€{Math.round(currentResult.adjusted_calculation.total).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          {currentResult.recommendations?.length > 0 && (
            <Card className="border-blue-300 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-sm">💡 Empfehlungen</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {currentResult.recommendations.map((rec, i) => (
                    <li key={i} className="text-sm flex gap-2">
                      <span>→</span> {rec}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Comparison Chart */}
      {comparisonData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">📈 Szenario-Vergleich</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="scenario" />
                <YAxis />
                <Tooltip formatter={(value) => `€${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="tax" fill="#ef4444" name="Steuerlast" />
                <Bar dataKey="savings" fill="#10b981" name="Einsparungen" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}