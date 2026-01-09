import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const riskColors = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700'
};

export default function CashflowForecastChart({ forecasts = [] }) {
  if (forecasts.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-slate-600 font-light">Keine Cashflow-Prognosen verfügbar</p>
      </Card>
    );
  }

  // Sort by date and format for chart
  const chartData = forecasts
    .sort((a, b) => new Date(a.forecast_month) - new Date(b.forecast_month))
    .map(f => ({
      ...f,
      month: format(new Date(f.forecast_month), 'MMM yyyy', { locale: de }),
      income: parseFloat(f.projected_income),
      expenses: parseFloat(f.projected_expenses),
      balance: parseFloat(f.projected_balance)
    }));

  const bottlenecks = forecasts.filter(f => f.potential_bottleneck);
  const avgConfidence = (forecasts.reduce((sum, f) => sum + f.confidence_score, 0) / forecasts.length).toFixed(0);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs font-light text-slate-600 uppercase">Durchschn. monatliche Einnahmen</p>
          <p className="text-2xl font-light text-slate-900 mt-2">
            {(chartData.reduce((sum, d) => sum + d.income, 0) / chartData.length).toFixed(2)} €
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-light text-slate-600 uppercase">Durchschn. monatliche Ausgaben</p>
          <p className="text-2xl font-light text-slate-900 mt-2">
            {(chartData.reduce((sum, d) => sum + d.expenses, 0) / chartData.length).toFixed(2)} €
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-light text-slate-600 uppercase">Prognose-Genauigkeit</p>
          <p className="text-2xl font-light text-slate-900 mt-2">{avgConfidence}%</p>
        </Card>
      </div>

      {/* Charts */}
      <Card className="p-4">
        <h3 className="font-light text-slate-900 mb-4">Einnahmen vs. Ausgaben</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => `${value.toFixed(2)} €`} />
            <Legend />
            <Bar dataKey="income" fill="#10b981" name="Einnahmen" />
            <Bar dataKey="expenses" fill="#ef4444" name="Ausgaben" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-4">
        <h3 className="font-light text-slate-900 mb-4">Monatlicher Saldo</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => `${value.toFixed(2)} €`} />
            <Legend />
            <Line type="monotone" dataKey="balance" stroke="#3b82f6" name="Saldo" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Alerts */}
      {bottlenecks.length > 0 && (
        <Card className="p-4 bg-red-50 border-red-200">
          <h3 className="font-light text-red-900 mb-2">🚨 Finanzielle Engpässe erkannt</h3>
          <div className="space-y-2">
            {bottlenecks.map(f => (
              <p key={f.id} className="text-sm font-light text-red-800">
                {format(new Date(f.forecast_month), 'MMMM yyyy', { locale: de })}: 
                Saldo {parseFloat(f.forecast_data?.cumulative_balance || 0).toFixed(2)} € 
                <Badge className="ml-2">{f.risk_level}</Badge>
              </p>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}