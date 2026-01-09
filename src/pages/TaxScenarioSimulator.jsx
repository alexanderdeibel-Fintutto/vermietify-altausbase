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
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Zap, TrendingDown } from 'lucide-react';

export default function TaxScenarioSimulator() {
  const [country, setCountry] = useState('DE');
  const [scenarioType, setScenarioType] = useState('income_adjustment');
  const [parameters, setParameters] = useState({ income: 100000, deductions: 15000 });
  const [simulating, setSimulating] = useState(false);

  const { data: result = {}, isLoading } = useQuery({
    queryKey: ['taxScenario', country, scenarioType, parameters],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateAdvancedTaxScenario', {
        country,
        scenarioType,
        parameters
      });
      return response.data?.scenario || {};
    },
    enabled: simulating
  });

  const scenarios = [
    { value: 'income_adjustment', label: 'Einkommensanpassung' },
    { value: 'deduction_increase', label: 'Erhöhte Abzüge' },
    { value: 'structure_change', label: 'Strukturänderung' },
    { value: 'timing_shift', label: 'Einkommens-Timing' },
    { value: 'investment_scenario', label: 'Anlage-Szenario' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">🎲 Steuer-Szenario-Simulator</h1>
        <p className="text-slate-500 mt-1">Testen Sie verschiedene Szenarien und deren Auswirkungen</p>
      </div>

      {/* Scenario Setup */}
      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">Szenario-Konfiguration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Land</label>
              <Select value={country} onValueChange={setCountry} disabled={simulating}>
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
              <label className="text-sm font-medium">Szenario-Typ</label>
              <Select value={scenarioType} onValueChange={setScenarioType} disabled={simulating}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {scenarios.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Einkommen (€)</label>
              <Input
                type="number"
                value={parameters.income}
                onChange={(e) => setParameters({ ...parameters, income: parseInt(e.target.value) || 0 })}
                disabled={simulating}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Abzüge (€)</label>
              <Input
                type="number"
                value={parameters.deductions}
                onChange={(e) => setParameters({ ...parameters, deductions: parseInt(e.target.value) || 0 })}
                disabled={simulating}
              />
            </div>
          </div>

          <Button
            onClick={() => setSimulating(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            disabled={simulating}
          >
            {simulating ? '⏳ Wird simuliert...' : 'Szenario simulieren'}
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8">⏳ Simulation läuft...</div>
      ) : simulating && result.content ? (
        <>
          {/* Impact Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-slate-600">Steuerauswirkung</p>
                <p className={`text-2xl font-bold mt-2 ${(result.content.tax_impact || 0) < 0 ? 'text-green-600' : 'text-red-600'}`}>
                  €{Math.round(result.content.tax_impact || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-slate-600">Geschätzte Verbindlichkeit</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">
                  €{Math.round(result.content.projected_liability || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-slate-600">Einsparungen vs. Basis</p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  €{Math.round(result.content.savings_vs_baseline || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-slate-600">Machbarkeit</p>
                <p className={`text-lg font-bold mt-2 ${result.content.feasibility === 'high' ? 'text-green-600' : result.content.feasibility === 'medium' ? 'text-yellow-600' : 'text-red-600'}`}>
                  {result.content.feasibility}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Implementation Steps */}
          {(result.content?.implementation_steps || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  📋 Implementierungsschritte
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.content.implementation_steps.map((step, i) => (
                  <div key={i} className="text-sm p-2 bg-slate-50 rounded flex gap-2">
                    <span className="text-blue-600 font-bold flex-shrink-0">{i + 1}.</span>
                    {step}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Success Factors */}
          {(result.content?.success_factors || []).length > 0 && (
            <Card className="border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle className="text-sm">✓ Erfolgsfaktoren</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.content.success_factors.map((factor, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded">
                    • {factor}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Risk Assessment */}
          {result.content?.risk_score !== undefined && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">🛡️ Risikobewertung</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  Risiko-Score: <span className="font-bold">{Math.round(result.content.risk_score)}/100</span>
                </p>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-slate-500">
          Konfigurieren Sie ein Szenario und klicken Sie "Szenario simulieren"
        </div>
      )}
    </div>
  );
}