import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Loader2, TrendingDown, AlertTriangle } from 'lucide-react';

export default function BudgetVsActualWidget() {
  const [selectedCategory, setSelectedCategory] = useState(null);

  const { data: budgetData, isLoading: budgetLoading } = useQuery({
    queryKey: ['budgetVsActual'],
    queryFn: async () => {
      try {
        const reports = await base44.entities.FinancialReport.list('-period_start', 6);
        const budgets = await base44.entities.RollingBudget.list('-created_at', 1);

        if (reports.length === 0 || budgets.length === 0) {
          return null;
        }

        // Get latest report and budget
        const latestReport = reports[0];
        const latestBudget = budgets[0];

        // Prepare category comparison data
        const categoryComparison = [];
        const actualExpenses = latestReport.analysis?.expense_analysis?.categories || {};
        const currentPeriod = latestBudget.periods?.[0];
        const budgetedAmounts = currentPeriod?.category_budgets || {};

        for (const [category, actual] of Object.entries(actualExpenses)) {
          const budgeted = budgetedAmounts[category] || 0;
          const variance = actual - budgeted;
          const variancePercent = budgeted > 0 ? (variance / budgeted) * 100 : 0;
          const utilizationPercent = budgeted > 0 ? (actual / budgeted) * 100 : 0;

          categoryComparison.push({
            category,
            actual: Math.round(actual),
            budgeted: Math.round(budgeted),
            variance: Math.round(variance),
            variancePercent: Math.round(variancePercent),
            utilizationPercent: Math.round(utilizationPercent),
            status: utilizationPercent > 100 ? 'over' : utilizationPercent > 80 ? 'warning' : 'ok'
          });
        }

        return {
          reportPeriod: `${latestReport.period_start} bis ${latestReport.period_end}`,
          totalActual: Math.round(latestReport.metrics?.total_expenses || 0),
          totalBudgeted: Object.values(budgetedAmounts).reduce((a, b) => a + b, 0),
          categories: categoryComparison.sort((a, b) => b.actual - a.actual)
        };
      } catch (error) {
        console.warn('Error loading budget data:', error);
        return null;
      }
    },
    staleTime: 60 * 60 * 1000
  });

  if (budgetLoading) {
    return (
      <Card>
        <CardContent className="pt-4 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!budgetData) {
    return (
      <Card className="bg-slate-50">
        <CardContent className="pt-4 text-center">
          <p className="text-sm text-slate-600">Keine Budget- oder Ausgabendaten verfügbar</p>
        </CardContent>
      </Card>
    );
  }

  const totalVariancePercent = budgetData.totalBudgeted > 0 
    ? Math.round(((budgetData.totalActual - budgetData.totalBudgeted) / budgetData.totalBudgeted) * 100)
    : 0;

  const overBudgetCount = budgetData.categories.filter(c => c.status === 'over').length;
  const warningCount = budgetData.categories.filter(c => c.status === 'warning').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-blue-600" />
            Budget vs. Tatsächlich
          </span>
          <span className="text-sm font-normal text-slate-600">{budgetData.reportPeriod}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-blue-50 rounded border border-blue-200">
            <p className="text-xs text-blue-700 font-semibold mb-1">Budget gesamt</p>
            <p className="text-lg font-bold text-blue-900">{budgetData.totalBudgeted.toLocaleString('de-DE')}€</p>
          </div>
          <div className={`p-3 rounded border ${
            totalVariancePercent > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
          }`}>
            <p className={`text-xs font-semibold mb-1 ${
              totalVariancePercent > 0 ? 'text-red-700' : 'text-green-700'
            }`}>Tatsächlich</p>
            <p className={`text-lg font-bold ${
              totalVariancePercent > 0 ? 'text-red-900' : 'text-green-900'
            }`}>{budgetData.totalActual.toLocaleString('de-DE')}€</p>
          </div>
          <div className={`p-3 rounded border ${
            totalVariancePercent > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
          }`}>
            <p className={`text-xs font-semibold mb-1 ${
              totalVariancePercent > 0 ? 'text-red-700' : 'text-green-700'
            }`}>Abweichung</p>
            <p className={`text-lg font-bold ${
              totalVariancePercent > 0 ? 'text-red-900' : 'text-green-900'
            }`}>{totalVariancePercent > 0 ? '+' : ''}{totalVariancePercent}%</p>
          </div>
        </div>

        {/* Alerts */}
        {(overBudgetCount > 0 || warningCount > 0) && (
          <div className="space-y-2">
            {overBudgetCount > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span className="text-sm text-red-800">
                  <strong>{overBudgetCount} Kategorie(n)</strong> überschreiten das Budget
                </span>
              </div>
            )}
            {warningCount > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                <span className="text-sm text-yellow-800">
                  <strong>{warningCount} Kategorie(n)</strong> zu 80% ausgeschöpft
                </span>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="chart" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chart">Vergleich</TabsTrigger>
            <TabsTrigger value="categories">Kategorien</TabsTrigger>
          </TabsList>

          {/* Chart View */}
          <TabsContent value="chart" className="mt-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={budgetData.categories.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value) => `${value.toLocaleString('de-DE')}€`} />
                <Legend />
                <Bar dataKey="budgeted" fill="#3b82f6" name="Budget" />
                <Bar dataKey="actual" name="Tatsächlich">
                  {budgetData.categories.slice(0, 10).map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={entry.status === 'over' ? '#ef4444' : entry.status === 'warning' ? '#f59e0b' : '#10b981'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          {/* Category Detail View */}
          <TabsContent value="categories" className="space-y-2">
            {budgetData.categories.map((cat) => (
              <div key={cat.category} className="p-3 bg-slate-50 rounded border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold">{cat.category}</p>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                    cat.status === 'over' ? 'bg-red-100 text-red-800' :
                    cat.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {cat.utilizationPercent}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 mb-1">
                  <div
                    className={`h-2 rounded-full ${
                      cat.status === 'over' ? 'bg-red-600' :
                      cat.status === 'warning' ? 'bg-yellow-600' :
                      'bg-green-600'
                    }`}
                    style={{ width: `${Math.min(cat.utilizationPercent, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>{cat.actual.toLocaleString('de-DE')}€ / {cat.budgeted.toLocaleString('de-DE')}€</span>
                  <span className={cat.variance > 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>
                    {cat.variance > 0 ? '+' : ''}{cat.variance.toLocaleString('de-DE')}€
                  </span>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}