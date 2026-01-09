import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';

export default function ScenarioComparison({ budgetId }) {
  const [selectedScenarios, setSelectedScenarios] = useState([]);

  const { data: scenarios, isLoading } = useQuery({
    queryKey: ['scenariosComparison', budgetId],
    queryFn: async () => {
      try {
        return await base44.entities.BudgetScenario.filter(
          { rolling_budget_id: budgetId },
          '-created_at',
          50
        );
      } catch {
        return [];
      }
    }
  });

  const toggleScenario = (scenarioId) => {
    setSelectedScenarios(prev =>
      prev.includes(scenarioId)
        ? prev.filter(id => id !== scenarioId)
        : [...prev, scenarioId]
    );
  };

  // Prepare chart data
  const prepareChartData = () => {
    if (selectedScenarios.length === 0) return [];

    const selected = scenarios?.filter(s => selectedScenarios.includes(s.id)) || [];
    if (selected.length === 0) return [];

    // Get all categories from first scenario
    const firstScenario = selected[0];
    const categories = Object.keys(firstScenario.baseline_budget || {});

    return categories.map(category => {
      const data = { category };
      selected.forEach(scenario => {
        data[`${scenario.scenario_name}`] = scenario.scenario_budget?.[category] || 0;
      });
      return data;
    });
  };

  // Prepare variance data
  const prepareVarianceData = () => {
    if (selectedScenarios.length === 0) return [];

    const selected = scenarios?.filter(s => selectedScenarios.includes(s.id)) || [];
    if (selected.length === 0) return [];

    return selected.map(scenario => ({
      name: scenario.scenario_name,
      variance: scenario.financial_impact?.total_variance || 0,
      variance_percentage: scenario.financial_impact?.variance_percentage || 0
    }));
  };

  const chartData = prepareChartData();
  const varianceData = prepareVarianceData();

  const COLORS = ['#0f172a', '#64748b', '#94a3b8', '#cbd5e1'];

  if (isLoading) {
    return <Loader2 className="w-6 h-6 animate-spin" />;
  }

  return (
    <div className="space-y-4">
      {/* Scenario Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Szenarien zum Vergleich</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {scenarios && scenarios.length > 0 ? (
            scenarios.map(scenario => (
              <label key={scenario.id} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-slate-50 rounded">
                <Checkbox
                  checked={selectedScenarios.includes(scenario.id)}
                  onCheckedChange={() => toggleScenario(scenario.id)}
                />
                <div className="flex-1">
                  <p className="font-semibold text-sm">{scenario.scenario_name}</p>
                  <p className="text-xs text-slate-600">{scenario.description}</p>
                </div>
                <Badge className={
                  scenario.scenario_type === 'optimistic' ? 'bg-green-100 text-green-800' :
                  scenario.scenario_type === 'pessimistic' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }>
                  {scenario.scenario_type}
                </Badge>
              </label>
            ))
          ) : (
            <p className="text-sm text-slate-600">Keine Szenarien verfügbar</p>
          )}
        </CardContent>
      </Card>

      {selectedScenarios.length > 0 && (
        <>
          {/* Budget Comparison Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Budget-Vergleich nach Kategorie</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip formatter={(value) => `${value.toLocaleString('de-DE')} €`} />
                  <Legend />
                  {scenarios
                    ?.filter(s => selectedScenarios.includes(s.id))
                    .map((scenario, idx) => (
                      <Bar
                        key={scenario.id}
                        dataKey={scenario.scenario_name}
                        fill={COLORS[idx % COLORS.length]}
                      />
                    ))}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Financial Impact Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Finanzielle Auswirkungen</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={varianceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => `${value.toLocaleString('de-DE')} €`}
                    labelFormatter={(label) => `Szenario: ${label}`}
                  />
                  <Bar 
                    dataKey="variance" 
                    fill="#6366f1" 
                    name="Gesamtveränderung (€)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Detailed Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detaillierter Vergleich</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-semibold">Szenario</th>
                    <th className="text-left py-2 px-3 font-semibold">Gesamtbudget</th>
                    <th className="text-left py-2 px-3 font-semibold">Veränderung</th>
                    <th className="text-left py-2 px-3 font-semibold">Veränderung %</th>
                    <th className="text-left py-2 px-3 font-semibold">Risiken</th>
                  </tr>
                </thead>
                <tbody>
                  {scenarios
                    ?.filter(s => selectedScenarios.includes(s.id))
                    .map(scenario => {
                      const totalBudget = Object.values(scenario.scenario_budget || {}).reduce((a, b) => a + b, 0);
                      return (
                        <tr key={scenario.id} className="border-b hover:bg-slate-50">
                          <td className="py-3 px-3">
                            <p className="font-semibold">{scenario.scenario_name}</p>
                          </td>
                          <td className="py-3 px-3 font-semibold">
                            {totalBudget.toLocaleString('de-DE')} €
                          </td>
                          <td className={`py-3 px-3 font-semibold ${
                            scenario.financial_impact?.total_variance >= 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {scenario.financial_impact?.total_variance > 0 ? '+' : ''}
                            {scenario.financial_impact?.total_variance.toLocaleString('de-DE')} €
                          </td>
                          <td className="py-3 px-3 font-semibold">
                            {scenario.financial_impact?.variance_percentage}%
                          </td>
                          <td className="py-3 px-3 text-xs">
                            <Badge variant="outline" className="text-xs">
                              {scenario.risk_factors?.length || 0}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Risk Factors */}
          <Card className="bg-amber-50 border-amber-200">
            <CardHeader>
              <CardTitle className="text-base">Identifizierte Risiken</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {scenarios
                ?.filter(s => selectedScenarios.includes(s.id))
                .map(scenario => (
                  <div key={scenario.id}>
                    <p className="font-semibold text-sm text-amber-900 mb-1">{scenario.scenario_name}</p>
                    <div className="space-y-1">
                      {scenario.risk_factors?.map((risk, idx) => (
                        <p key={idx} className="text-xs text-amber-800 bg-white rounded px-2 py-1">
                          • {risk}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </>
      )}

      {selectedScenarios.length === 0 && scenarios && scenarios.length > 0 && (
        <Card className="bg-slate-50">
          <CardContent className="pt-4 text-center">
            <p className="text-sm text-slate-600">Wählen Sie mindestens 2 Szenarien zum Vergleichen aus</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}