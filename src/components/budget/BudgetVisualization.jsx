import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Zap } from 'lucide-react';

export default function BudgetVisualization({ budget, scenario }) {
  const [visualizationType, setVisualizationType] = useState('pie');

  if (!budget) return null;

  const currentData = scenario?.scenario_budget || {};
  const categoryBreakdown = Object.entries(currentData).map(([category, amount]) => ({
    name: category,
    value: amount
  }));

  const totalBudget = Object.values(currentData).reduce((a, b) => a + b, 0);
  const COLORS = ['#0f172a', '#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0', '#f1f5f9'];

  // Calculate differences if scenario exists
  const baselineData = scenario?.baseline_budget || {};
  const differences = Object.entries(currentData).map(([category, amount]) => ({
    category,
    baseline: baselineData[category] || 0,
    scenario: amount,
    difference: amount - (baselineData[category] || 0)
  }));

  return (
    <div className="space-y-4">
      {scenario && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4 flex items-start gap-3">
            <Zap className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-sm text-blue-900">{scenario.scenario_name}</p>
              <p className="text-xs text-blue-800 mt-1">{scenario.description}</p>
            </div>
            <Badge className="bg-blue-100 text-blue-800">
              {scenario.scenario_type}
            </Badge>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="breakdown">Aufschlüsselung</TabsTrigger>
          {scenario && <TabsTrigger value="comparison">Vergleich</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Gesamtbudget</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-2">
              <p className="text-4xl font-bold text-slate-900">
                {totalBudget.toLocaleString('de-DE')} €
              </p>
              {scenario?.financial_impact && (
                <div>
                  <p className={`font-semibold ${
                    scenario.financial_impact.total_variance >= 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {scenario.financial_impact.total_variance > 0 ? '+' : ''}
                    {scenario.financial_impact.total_variance.toLocaleString('de-DE')} €
                    ({scenario.financial_impact.variance_percentage}%)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Budget-Verteilung</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${(value / totalBudget * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value.toLocaleString('de-DE')} €`} />
                </PieChart>
              </ResponsiveContainer>

              <div className="mt-4 space-y-2">
                {categoryBreakdown.map((item, idx) => (
                  <div key={item.name} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      <span className="text-sm font-semibold">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">{item.value.toLocaleString('de-DE')} €</p>
                      <p className="text-xs text-slate-600">{(item.value / totalBudget * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {scenario && (
          <TabsContent value="comparison" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Szenario-Vergleich</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={differences}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip formatter={(value) => `${value.toLocaleString('de-DE')} €`} />
                    <Legend />
                    <Bar dataKey="baseline" fill="#94a3b8" name="Basis" />
                    <Bar dataKey="scenario" fill="#3b82f6" name="Szenario" />
                  </BarChart>
                </ResponsiveContainer>

                <div className="mt-4 space-y-2">
                  {differences.map(item => (
                    <div key={item.category} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                      <span className="font-semibold text-sm">{item.category}</span>
                      <div className="text-right">
                        <p className={`font-semibold text-sm ${item.difference >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {item.difference > 0 ? '+' : ''}
                          {item.difference.toLocaleString('de-DE')} €
                        </p>
                        <p className="text-xs text-slate-600">
                          {item.baseline.toLocaleString('de-DE')} € → {item.scenario.toLocaleString('de-DE')} €
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}