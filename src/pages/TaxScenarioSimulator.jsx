import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function TaxScenarioSimulator() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [scenarioName, setScenarioName] = useState('');
  const [changes, setChanges] = useState('');
  const [simulating, setSimulating] = useState(false);

  const { data: result = {}, isLoading } = useQuery({
    queryKey: ['taxScenario', country, taxYear, scenarioName, changes],
    queryFn: async () => {
      const response = await base44.functions.invoke('simulateTaxScenario', {
        country,
        taxYear,
        scenarioName,
        changes: changes ? JSON.parse(changes) : {}
      });
      return response.data?.simulation || {};
    },
    enabled: simulating && !!scenarioName && !!changes
  });

  const handleSimulate = () => {
    try {
      JSON.parse(changes || '{}');
      setSimulating(true);
    } catch {
      alert('JSON Format invalid');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">🎲 Tax Scenario Simulator</h1>
        <p className="text-slate-500 mt-1">Spielen Sie verschiedene Steuern-Szenarien durch</p>
      </div>

      {/* Input Form */}
      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">Szenario definieren</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <label className="text-sm font-medium">Steuerjahr</label>
              <Select value={String(taxYear)} onValueChange={(v) => setTaxYear(parseInt(v))} disabled={simulating}>
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

          <div>
            <label className="text-sm font-medium">Szenario Name</label>
            <Input
              placeholder="z.B. Erhöhte Betriebsausgaben"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              disabled={simulating}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Änderungen (JSON)</label>
            <Textarea
              placeholder='{"income": 100000, "expenses": 25000, "deductions": 5000}'
              value={changes}
              onChange={(e) => setChanges(e.target.value)}
              disabled={simulating}
              className="font-mono text-xs h-24"
            />
            <p className="text-xs text-slate-500 mt-1">Beispiel: Einkommen, Ausgaben, Abzüge...</p>
          </div>

          <Button
            onClick={handleSimulate}
            disabled={simulating || !scenarioName || !changes}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {simulating ? 'Wird simuliert...' : 'Simulieren'}
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8">⏳ Simulation läuft...</div>
      ) : simulating && Object.keys(result).length > 0 ? (
        <>
          {/* Tax Impact */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-red-300 bg-red-50">
              <CardContent className="pt-6">
                <p className="text-xs text-slate-600">Steuer vorher</p>
                <p className="text-2xl font-bold text-red-600 mt-2">
                  €{Math.round(result.base_tax || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card className="border-green-300 bg-green-50">
              <CardContent className="pt-6">
                <p className="text-xs text-slate-600">Steuer nachher</p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  €{Math.round(result.scenario_tax || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card className="border-blue-300 bg-blue-50">
              <CardContent className="pt-6">
                <p className="text-xs text-slate-600">Einsparungen</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">
                  €{Math.round(result.tax_savings || 0).toLocaleString()}
                </p>
                <p className="text-xs text-slate-600 mt-1">{Math.round(result.tax_savings_percentage || 0)}%</p>
              </CardContent>
            </Card>
          </div>

          {/* Effective Rate */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">📊 Effektiver Steuersatz</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-center flex-1">
                  <p className="text-sm text-slate-600">Vorher</p>
                  <p className="text-3xl font-bold text-red-600 mt-1">
                    {Math.round((result.effective_rate_before || 0) * 10) / 10}%
                  </p>
                </div>
                <TrendingDown className="w-8 h-8 text-slate-400 mx-4" />
                <div className="text-center flex-1">
                  <p className="text-sm text-slate-600">Nachher</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">
                    {Math.round((result.effective_rate_after || 0) * 10) / 10}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feasibility */}
          <Card className={
            result.feasibility === 'highly_feasible' ? 'border-green-300 bg-green-50' :
            result.feasibility === 'feasible' ? 'border-blue-300 bg-blue-50' :
            'border-orange-300 bg-orange-50'
          }>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className={
                  result.feasibility === 'highly_feasible' ? 'w-6 h-6 text-green-600' :
                  'w-6 h-6 text-orange-600'
                } />
                <div>
                  <p className="text-sm font-medium">Machbarkeit</p>
                  <p className="text-xs text-slate-600 mt-1">{result.feasibility}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendation */}
          {result.recommendation && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">💡 Empfehlung</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{result.recommendation}</p>
              </CardContent>
            </Card>
          )}

          {/* Compliance Impact */}
          {(result.compliance_impact || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">⚖️ Compliance-Auswirkungen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.compliance_impact.map((impact, i) => (
                  <div key={i} className="text-sm p-2 bg-slate-50 rounded">
                    {impact}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Risks */}
          {(result.risks || []).length > 0 && (
            <Card className="border-orange-300 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  ⚠️ Risiken
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.risks.map((risk, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded">
                    {risk}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-slate-500">
          Definieren Sie ein Szenario und klicken Sie "Simulieren"
        </div>
      )}
    </div>
  );
}