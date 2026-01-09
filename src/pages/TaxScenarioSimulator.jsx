import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, TrendingDown } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

const SCENARIO_TYPES = [
  { id: 'income_increase', label: 'Einkommenssteigerung', icon: '📈' },
  { id: 'deduction_increase', label: 'Zusätzliche Abzüge', icon: '📉' },
  { id: 'business_expansion', label: 'Geschäftserweiterung', icon: '🏢' },
  { id: 'investment_change', label: 'Investment-Änderung', icon: '💰' }
];

export default function TaxScenarioSimulator() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [scenarioType, setScenarioType] = useState('income_increase');
  const [paramValue, setParamValue] = useState('');
  const [showResult, setShowResult] = useState(false);

  const { data: simulation = {}, isLoading } = useQuery({
    queryKey: ['taxScenario', country, taxYear, scenarioType, paramValue],
    queryFn: async () => {
      if (!paramValue) return {};
      const response = await base44.functions.invoke('simulateTaxScenario', {
        country,
        taxYear,
        scenarioType,
        parameters: { value: parseFloat(paramValue) }
      });
      return response.data?.simulation || {};
    },
    enabled: showResult && !!paramValue
  });

  const getScenarioIcon = () => {
    const scenario = SCENARIO_TYPES.find(s => s.id === scenarioType);
    return scenario?.icon || '❓';
  };

  const isPositiveChange = (simulation.result?.percentage_change || 0) < 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📊 Tax Scenario Simulator</h1>
        <p className="text-slate-500 mt-1">Simulieren Sie verschiedene Steuersituationen</p>
      </div>

      {/* Scenario Builder */}
      <Card className="border-2 border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">🎯 Szenario-Parameter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
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
            <div>
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
          </div>

          <div>
            <label className="text-sm font-medium">Szenario-Typ</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
              {SCENARIO_TYPES.map(scenario => (
                <button
                  key={scenario.id}
                  onClick={() => setScenarioType(scenario.id)}
                  className={`p-3 rounded border-2 text-center transition ${
                    scenarioType === scenario.id
                      ? 'border-blue-500 bg-blue-100'
                      : 'border-slate-200 bg-white hover:border-blue-300'
                  }`}
                >
                  <p className="text-xl mb-1">{scenario.icon}</p>
                  <p className="text-xs font-medium">{scenario.label}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Wert (€ oder %)</label>
            <Input
              type="number"
              placeholder="z.B. 5000 oder 10"
              value={paramValue}
              onChange={(e) => setParamValue(e.target.value)}
            />
          </div>

          <Button
            onClick={() => setShowResult(true)}
            disabled={!paramValue}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Szenario Simulieren
          </Button>
        </CardContent>
      </Card>

      {isLoading && showResult && (
        <div className="text-center py-8">⏳ Szenario wird berechnet...</div>
      )}

      {showResult && simulation.result && (
        <>
          {/* Tax Impact Summary */}
          <Card className={`border-2 ${isPositiveChange ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-sm text-slate-600">Szenario-Name</p>
                  <p className="font-bold text-lg mt-2">{getScenarioIcon()} {simulation.result?.scenario_name || 'N/A'}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-600">Projizierte Steuer</p>
                  <p className="text-2xl font-bold text-blue-600 mt-2">
                    €{Math.round(simulation.result?.projected_tax || 0).toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-600">Änderung</p>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    {isPositiveChange ? (
                      <TrendingDown className="w-5 h-5 text-green-600" />
                    ) : (
                      <TrendingUp className="w-5 h-5 text-red-600" />
                    )}
                    <p className={`text-xl font-bold ${isPositiveChange ? 'text-green-600' : 'text-red-600'}`}>
                      €{Math.round(simulation.result?.tax_change || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-600">% Änderung</p>
                  <p className={`text-2xl font-bold mt-2 ${isPositiveChange ? 'text-green-600' : 'text-red-600'}`}>
                    {(simulation.result?.percentage_change || 0).toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {simulation.result?.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📋 Szenario-Beschreibung</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-700">
                {simulation.result.description}
              </CardContent>
            </Card>
          )}

          {/* Feasibility & Risk */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600">Machbarkeit</p>
                <Badge className="mt-2 bg-blue-100 text-blue-800">
                  {simulation.result?.feasibility || 'UNKNOWN'}
                </Badge>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600">Risiko-Level</p>
                <Badge className={`mt-2 ${
                  simulation.result?.risk_level?.toLowerCase() === 'high'
                    ? 'bg-red-100 text-red-800'
                    : simulation.result?.risk_level?.toLowerCase() === 'medium'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {simulation.result?.risk_level || 'UNKNOWN'}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Advantages */}
          {(simulation.result?.advantages || []).length > 0 && (
            <Card className="border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle className="text-sm">✅ Vorteile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {simulation.result.advantages.map((adv, i) => (
                  <div key={i} className="flex gap-2 text-sm">
                    <span className="text-green-600 flex-shrink-0">✓</span>
                    {adv}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Disadvantages */}
          {(simulation.result?.disadvantages || []).length > 0 && (
            <Card className="border-orange-300 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-sm">⚠️ Nachteile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {simulation.result.disadvantages.map((dis, i) => (
                  <div key={i} className="flex gap-2 text-sm">
                    <span className="text-orange-600 flex-shrink-0">!</span>
                    {dis}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Implementation Steps */}
          {(simulation.result?.implementation_steps || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">🚀 Umsetzungs-Schritte</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {simulation.result.implementation_steps.map((step, i) => (
                  <div key={i} className="flex gap-3 text-sm p-2 bg-slate-50 rounded">
                    <span className="font-bold text-blue-600 flex-shrink-0">{i + 1}.</span>
                    {step}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Monthly Impact */}
          {simulation.result?.monthly_impact && (
            <Alert className="border-blue-300 bg-blue-50">
              <AlertDescription className="text-blue-900 text-sm">
                <strong>📅 Monatliche Auswirkung:</strong> €{Math.round(simulation.result.monthly_impact).toLocaleString()} / Monat
              </AlertDescription>
            </Alert>
          )}
        </>
      )}
    </div>
  );
}