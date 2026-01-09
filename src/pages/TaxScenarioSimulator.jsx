import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingDown, TrendingUp, Zap, Save, Trash2 } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

const SCENARIO_CONFIG = {
  AT: [
    { value: 'income_adjustment', label: '📈 Einkommen anpassen', params: ['income_change'] },
    { value: 'deduction_optimization', label: '📝 Werbungskosten optimieren', params: ['additional_deductions'] },
    { value: 'capital_gain_planning', label: '💰 Kapitalgewinne planen', params: ['capital_gain', 'holding_period_years', 'private_asset'] },
    { value: 'tax_loss_harvesting', label: '📉 Steuerverluste ernten', params: ['losses'] }
  ],
  CH: [
    { value: 'income_adjustment', label: '📈 Einkommen anpassen', params: ['income_change', 'cantonal_rate', 'communal_rate'] },
    { value: 'wealth_tax_reduction', label: '💎 Vermögenssteuer reduzieren', params: ['wealth_reduction', 'wealth_tax_rate'] },
    { value: 'mortgage_optimization', label: '🏠 Hypothekarzinsen optimieren', params: ['mortgage_interest', 'combined_tax_rate'] },
    { value: 'canton_change', label: '🗺️ Kantonwechsel simulieren', params: ['old_combined_rate', 'new_combined_rate'] }
  ],
  DE: [
    { value: 'income_adjustment', label: '📈 Einkommen anpassen', params: ['income_change', 'church_tax_rate'] },
    { value: 'deduction_strategy', label: '📝 Werbungskosten & Sonderausgaben', params: ['additional_deductions'] },
    { value: 'capital_gains_timing', label: '💰 Kapitalgewinne zeitlich verschieben', params: ['capital_gain', 'holding_period_years'] },
    { value: 'loss_harvesting', label: '📉 Verluste nutzen', params: ['losses'] }
  ]
};

export default function TaxScenarioSimulator() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR - 1);
  const [scenarioType, setScenarioType] = useState(SCENARIO_CONFIG.DE[0].value);
  const [scenarioName, setScenarioName] = useState('');
  const [baseIncome, setBaseIncome] = useState(75000);
  const [baseTax, setBaseTax] = useState(25000);
  const [params, setParams] = useState({});
  const [scenarios, setScenarios] = useState([]);

  const queryClient = useQueryClient();

  // Run scenario
  const runMutation = useMutation({
    mutationFn: async () => {
      const { data } = await base44.functions.invoke('runTaxScenario', {
        country,
        taxYear,
        scenarioType,
        parameters: {
          base_income: baseIncome,
          base_total_tax: baseTax,
          ...params
        }
      });
      return data;
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (result) => {
      const user = await base44.auth.me();
      return await base44.entities.TaxScenario.create({
        user_email: user.email,
        country,
        tax_year: taxYear,
        scenario_name: scenarioName || `Szenario ${new Date().toLocaleDateString()}`,
        scenario_type: scenarioType,
        description: result.description,
        scenario_parameters: params,
        calculation_results: result,
        tax_savings: result.summary.tax_savings,
        tax_impact: result.summary.tax_savings,
        feasibility: result.feasibility,
        risk_level: result.risk_level,
        implementation_effort: result.implementation_effort,
        created_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxScenarios'] });
      setScenarioName('');
    }
  });

  const handleRunScenario = async () => {
    const result = await runMutation.mutateAsync();
    setScenarios([...scenarios, result]);
  };

  const currentConfig = SCENARIO_CONFIG[country];
  const selectedConfig = currentConfig.find(c => c.value === scenarioType);

  const chartData = scenarios.map((s, idx) => ({
    name: `Szenario ${idx + 1}`,
    before: s.summary.total_tax_before,
    after: s.summary.total_tax_after,
    savings: s.summary.tax_savings
  }));

  const comparisonData = [
    { label: 'Steuern vorher', value: baseTax, color: '#ef4444' },
    ...scenarios.map((s, idx) => ({ 
      label: `Szenario ${idx + 1}`, 
      value: s.summary.total_tax_after, 
      color: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'][idx % 4] 
    }))
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">🎯 Tax Scenario Simulator</h1>
        <p className="text-slate-500 mt-1">Simulieren Sie verschiedene Steuerszenarios und finden Sie optimale Strategien</p>
      </div>

      {/* Configuration Panel */}
      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle>Szenario konfigurieren</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Basic Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <Select value={taxYear.toString()} onValueChange={(v) => setTaxYear(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR].map(y => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Szenariotyp</label>
              <Select value={scenarioType} onValueChange={setScenarioType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCENARIO_CONFIG[country].map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Base Values */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <label className="text-sm font-medium">Basis-Einkommen (€/CHF)</label>
              <Input
                type="number"
                value={baseIncome}
                onChange={(e) => setBaseIncome(parseFloat(e.target.value))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Basis-Steuern (€/CHF)</label>
              <Input
                type="number"
                value={baseTax}
                onChange={(e) => setBaseTax(parseFloat(e.target.value))}
              />
            </div>
          </div>

          {/* Scenario-specific Parameters */}
          {selectedConfig && (
            <div className="pt-4 border-t space-y-3">
              {selectedConfig.params.map(paramKey => (
                <div key={paramKey}>
                  <label className="text-sm font-medium capitalize">{paramKey.replace(/_/g, ' ')}</label>
                  <Input
                    type={paramKey.includes('rate') ? 'number' : 'number'}
                    step={paramKey.includes('rate') ? '0.01' : '1'}
                    placeholder={`Geben Sie ${paramKey} ein`}
                    value={params[paramKey] || ''}
                    onChange={(e) => setParams({ ...params, [paramKey]: parseFloat(e.target.value) })}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Save Name */}
          <div className="pt-4 border-t">
            <label className="text-sm font-medium">Szenarioname (optional)</label>
            <Input
              placeholder="z.B. 'Erhöhtes Einkommen 2024'"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
            />
          </div>

          {/* Run Button */}
          <Button onClick={handleRunScenario} className="w-full bg-blue-600 hover:bg-blue-700 gap-2">
            <Zap className="w-4 h-4" /> Szenario ausführen
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {scenarios.length > 0 && (
        <>
          {/* Summary Cards */}
          <div className="space-y-4">
            {scenarios.map((scenario, idx) => (
              <Card key={idx} className={scenario.summary.tax_savings > 0 ? 'border-green-300 bg-green-50' : ''}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold mb-3">Szenario {idx + 1}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <p className="text-xs text-slate-600">Steuern vorher</p>
                          <p className="text-lg font-bold">{scenario.summary.total_tax_before.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600">Steuern nachher</p>
                          <p className="text-lg font-bold text-blue-600">{Math.round(scenario.summary.total_tax_after).toLocaleString()}</p>
                        </div>
                        <div className={scenario.summary.tax_savings > 0 ? 'bg-green-100 p-2 rounded' : ''}>
                          <p className="text-xs text-slate-600">Ersparnisse</p>
                          <p className={`text-lg font-bold ${scenario.summary.tax_savings > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {scenario.summary.tax_savings > 0 ? '+' : ''}{scenario.summary.tax_savings.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600">Effektiv-Quote</p>
                          <p className="text-lg font-bold">{scenario.summary.effective_rate_after}%</p>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4 flex-wrap">
                        <Badge className={
                          scenario.feasibility === 'highly_feasible' ? 'bg-green-100 text-green-800' :
                          scenario.feasibility === 'feasible' ? 'bg-blue-100 text-blue-800' :
                          'bg-orange-100 text-orange-800'
                        }>
                          {scenario.feasibility}
                        </Badge>
                        <Badge className={
                          scenario.risk_level === 'low' ? 'bg-green-100 text-green-800' :
                          scenario.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }>
                          Risk: {scenario.risk_level}
                        </Badge>
                      </div>
                    </div>

                    <Button
                      onClick={() => saveMutation.mutate(scenario)}
                      className="gap-2"
                    >
                      <Save className="w-4 h-4" /> Speichern
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Steuervergleich</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="before" fill="#ef4444" name="Steuern vorher" />
                    <Bar dataKey="after" fill="#3b82f6" name="Steuern nachher" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ersparnisse</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="savings" fill="#10b981" name="Ersparnisse" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {scenarios.length === 0 && (
        <Card className="text-center py-12 text-slate-500">
          <p>Konfigurieren Sie ein Szenario und klicken Sie "Szenario ausführen" um zu sehen, wie verschiedene Strategien Ihre Steuerlast auswirken.</p>
        </Card>
      )}
    </div>
  );
}