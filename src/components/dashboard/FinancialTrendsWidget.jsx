import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2, TrendingUp } from 'lucide-react';

export default function FinancialTrendsWidget() {
  const [timeframe, setTimeframe] = useState('monthly');

  const { data: reports, isLoading } = useQuery({
    queryKey: ['financialReports'],
    queryFn: async () => {
      try {
        return await base44.entities.FinancialReport.list('-generated_at', 24);
      } catch {
        return [];
      }
    }
  });

  const prepareChartData = () => {
    if (!reports || reports.length === 0) return [];

    const sorted = [...reports].sort((a, b) => new Date(a.period_start) - new Date(b.period_start));
    
    return sorted.map(report => ({
      period: formatPeriod(report.period_start, timeframe),
      income: report.metrics?.total_income || 0,
      expenses: report.metrics?.total_expenses || 0,
      savings: (report.metrics?.total_income || 0) - (report.metrics?.total_expenses || 0),
      savings_rate: report.metrics?.savings_rate || 0
    }));
  };

  const formatPeriod = (dateStr, frame) => {
    const date = new Date(dateStr);
    switch (frame) {
      case 'monthly':
        return date.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' });
      case 'quarterly':
        const q = Math.floor(date.getMonth() / 3) + 1;
        return `Q${q} ${date.getFullYear()}`;
      case 'yearly':
        return date.getFullYear().toString();
      default:
        return dateStr;
    }
  };

  const chartData = prepareChartData();
  const totalIncome = chartData.reduce((sum, d) => sum + d.income, 0);
  const totalExpenses = chartData.reduce((sum, d) => sum + d.expenses, 0);
  const avgSavingsRate = (chartData.reduce((sum, d) => sum + d.savings_rate, 0) / chartData.length).toFixed(1);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-4 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Finanztrends
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Übersicht</TabsTrigger>
            <TabsTrigger value="timeframe">Zeitraum</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-slate-50 p-2 rounded">
                <p className="text-slate-600">Ø Einkommen</p>
                <p className="font-semibold">{(totalIncome / chartData.length).toLocaleString('de-DE')} €</p>
              </div>
              <div className="bg-slate-50 p-2 rounded">
                <p className="text-slate-600">Ø Ausgaben</p>
                <p className="font-semibold">{(totalExpenses / chartData.length).toLocaleString('de-DE')} €</p>
              </div>
              <div className="bg-slate-50 p-2 rounded">
                <p className="text-slate-600">Ø Sparquote</p>
                <p className="font-semibold text-green-600">{avgSavingsRate}%</p>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip formatter={(value) => `${value.toLocaleString('de-DE')} €`} />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#10b981" name="Einkommen" />
                <Line type="monotone" dataKey="expenses" stroke="#ef4444" name="Ausgaben" />
                <Line type="monotone" dataKey="savings" stroke="#3b82f6" name="Ersparnisse" />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="timeframe">
            <div className="grid grid-cols-3 gap-2 mb-4">
              {['monthly', 'quarterly', 'yearly'].map(tf => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`py-2 px-3 rounded text-xs font-semibold transition ${
                    timeframe === tf
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {tf === 'monthly' ? 'Monatlich' : tf === 'quarterly' ? 'Quartal' : 'Jährlich'}
                </button>
              ))}
            </div>

            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip formatter={(value) => `${value.toLocaleString('de-DE')} €`} />
                <Legend />
                <Bar dataKey="income" fill="#10b981" name="Einkommen" />
                <Bar dataKey="expenses" fill="#ef4444" name="Ausgaben" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}