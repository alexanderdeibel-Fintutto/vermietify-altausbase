import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2, TrendingUp } from 'lucide-react';

export default function RollingBudgetComparisonWidget() {
  const { data: comparisonData, isLoading } = useQuery({
    queryKey: ['rollingBudgetComparison'],
    queryFn: async () => {
      try {
        const budgets = await base44.entities.RollingBudget.list('-created_at', 1);
        const reports = await base44.entities.FinancialReport.list('-period_start', 12);

        if (budgets.length === 0 || reports.length === 0) {
          return null;
        }

        const budget = budgets[0];
        const periods = budget.periods || [];

        // Map reports to budget periods
        const timeSeriesData = periods.slice(0, 6).map((period, idx) => {
          const report = reports.find(r =>
            r.period_start >= period.period_start && r.period_start <= period.period_end
          );

          const totalBudgeted = Object.values(period.category_budgets || {})
            .reduce((a, b) => a + b, 0);
          const totalActual = report?.metrics?.total_expenses || 0;

          return {
            period: period.period_start,
            budgeted: Math.round(totalBudgeted),
            actual: Math.round(totalActual),
            variance: Math.round(totalActual - totalBudgeted)
          };
        });

        return timeSeriesData;
      } catch (error) {
        console.warn('Error loading rolling budget comparison:', error);
        return null;
      }
    },
    staleTime: 60 * 60 * 1000
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-4 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!comparisonData || comparisonData.length === 0) {
    return (
      <Card className="bg-slate-50">
        <CardContent className="pt-4 text-center">
          <p className="text-sm text-slate-600">Keine Zeitreihendaten verfügbar</p>
        </CardContent>
      </Card>
    );
  }

  const avgVariance = Math.round(
    comparisonData.reduce((sum, d) => sum + d.variance, 0) / comparisonData.length
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          Rollierende Budget-Entwicklung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Trend Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-purple-50 rounded border border-purple-200">
            <p className="text-xs text-purple-700 font-semibold mb-1">Durchschnittliche Abweichung</p>
            <p className={`text-lg font-bold ${avgVariance > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {avgVariance > 0 ? '+' : ''}{avgVariance.toLocaleString('de-DE')}€
            </p>
          </div>
          <div className="p-3 bg-purple-50 rounded border border-purple-200">
            <p className="text-xs text-purple-700 font-semibold mb-1">Trend</p>
            <p className="text-lg font-bold text-purple-900">
              {comparisonData[comparisonData.length - 1].variance > comparisonData[0].variance ? '↑' : '↓'}
            </p>
          </div>
        </div>

        {/* Time Series Chart */}
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="period"
              tick={{ fontSize: 12 }}
              tickFormatter={(val) => new Date(val).toLocaleDateString('de-DE', { month: 'short', year: '2-digit' })}
            />
            <YAxis />
            <Tooltip
              formatter={(value) => `${value.toLocaleString('de-DE')}€`}
              labelFormatter={(label) => new Date(label).toLocaleDateString('de-DE')}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="budgeted"
              stroke="#3b82f6"
              name="Budget"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#10b981"
              name="Tatsächlich"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Detailed Period View */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-700">Perioden-Übersicht</p>
          {comparisonData.map((data, idx) => (
            <div key={idx} className="p-2 bg-slate-50 rounded border border-slate-200 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-semibold">
                  {new Date(data.period).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
                </span>
                <span className={`font-bold ${data.variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {data.variance > 0 ? '+' : ''}{data.variance.toLocaleString('de-DE')}€
                </span>
              </div>
              <div className="flex justify-between text-slate-600 mt-1">
                <span>Budget: {data.budgeted.toLocaleString('de-DE')}€</span>
                <span>Tatsächlich: {data.actual.toLocaleString('de-DE')}€</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}