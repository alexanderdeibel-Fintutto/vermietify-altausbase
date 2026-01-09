import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, DollarSign, Target } from 'lucide-react';

export default function TaxPerformanceDashboard() {
  const [taxYear] = useState(new Date().getFullYear() - 1);

  const { data: performance } = useQuery({
    queryKey: ['taxPerformance', taxYear],
    queryFn: async () => {
      const res = await base44.functions.invoke('generateTaxPerformanceDashboard', { tax_year: taxYear });
      return res.data;
    }
  });

  if (!performance) return <div className="p-4 text-slate-500">Loading...</div>;

  const analysis = performance.performance_analysis || {};
  const trend = analysis.tax_burden_trend || 'stable';
  const effectiveRate = analysis.average_effective_rate || 0;

  // Chart Daten aus historischen Daten
  const chartData = performance.historical_data?.map(calc => ({
    year: calc.tax_year,
    tax: calc.total_tax,
    income: calc.calculation_data?.gross_income || 0
  })) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-light">Steuerlast-Analyse</h1>
        <p className="text-slate-500 font-light mt-2">Historische Entwicklung & Trends</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-500 font-light">Durchschn. Effektiver Steuersatz</p>
            <p className="text-2xl font-light mt-2">{(effectiveRate * 100).toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-500 font-light">Trend</p>
            <p className={`text-2xl font-light mt-2 ${trend === 'increasing' ? 'text-orange-600' : trend === 'decreasing' ? 'text-green-600' : 'text-slate-600'}`}>
              {trend === 'increasing' ? '↑ Steigend' : trend === 'decreasing' ? '↓ Fallend' : '→ Stabil'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-500 font-light">Prognose nächstes Jahr</p>
            <p className="text-2xl font-light mt-2">${analysis.forecast_next_year?.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tax Burden Trend */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Steuerlast Entwicklung</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="tax" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Opportunities */}
      {analysis.improvement_opportunities?.length > 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              💡 Optimierungspotential
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm font-light">
            {analysis.improvement_opportunities.map((opp, i) => (
              <p key={i}>• {opp}</p>
            ))}
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      {analysis.kpis && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Key Performance Indicators</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm font-light">
            {Object.entries(analysis.kpis).map(([key, value]) => (
              <div key={key}>
                <p className="text-xs text-slate-500">{key}</p>
                <p className="text-lg font-light mt-1">{typeof value === 'number' ? value.toFixed(2) : value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}