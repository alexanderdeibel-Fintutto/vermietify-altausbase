import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

export default function FinancialForecast() {
  const [forecastPeriod, setForecastPeriod] = useState('6');

  const { data: payments = [] } = useQuery({
    queryKey: ['payments-forecast'],
    queryFn: () => base44.entities.Payment.list('-payment_date', 500)
  });

  const { data: financialItems = [] } = useQuery({
    queryKey: ['financial-items-forecast'],
    queryFn: () => base44.entities.FinancialItem.list('-date', 500)
  });

  // Calculate historical monthly data (last 12 months)
  const historicalData = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const month = date.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' });
    
    const monthPayments = payments.filter(p => {
      const pDate = new Date(p.payment_date);
      return pDate.getMonth() === date.getMonth() && 
             pDate.getFullYear() === date.getFullYear() &&
             p.status === 'paid';
    });

    const monthExpenses = financialItems.filter(item => {
      const iDate = new Date(item.date);
      return item.type === 'expense' &&
             iDate.getMonth() === date.getMonth() && 
             iDate.getFullYear() === date.getFullYear();
    });

    const income = monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const expenses = monthExpenses.reduce((sum, item) => sum + (item.amount || 0), 0);

    historicalData.push({
      month,
      income,
      expenses,
      profit: income - expenses,
      isHistorical: true
    });
  }

  // Calculate trends using linear regression
  const calculateTrend = (data) => {
    const n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    data.forEach((point, index) => {
      sumX += index;
      sumY += point;
      sumXY += index * point;
      sumX2 += index * index;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  };

  const incomeTrend = calculateTrend(historicalData.map(d => d.income));
  const expenseTrend = calculateTrend(historicalData.map(d => d.expenses));

  // Generate forecast
  const forecastData = [];
  const forecastMonths = parseInt(forecastPeriod);
  
  for (let i = 1; i <= forecastMonths; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() + i);
    const month = date.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' });
    
    const forecastIncome = incomeTrend.intercept + incomeTrend.slope * (historicalData.length + i);
    const forecastExpenses = expenseTrend.intercept + expenseTrend.slope * (historicalData.length + i);

    forecastData.push({
      month,
      income: Math.max(0, forecastIncome),
      expenses: Math.max(0, forecastExpenses),
      profit: forecastIncome - forecastExpenses,
      isHistorical: false
    });
  }

  const combinedData = [...historicalData, ...forecastData];

  // Calculate statistics
  const avgIncome = historicalData.reduce((sum, d) => sum + d.income, 0) / historicalData.length;
  const avgExpenses = historicalData.reduce((sum, d) => sum + d.expenses, 0) / historicalData.length;
  const forecastTotalIncome = forecastData.reduce((sum, d) => sum + d.income, 0);
  const forecastTotalExpenses = forecastData.reduce((sum, d) => sum + d.expenses, 0);
  
  const incomeTrendDirection = incomeTrend.slope > 0 ? 'up' : 'down';
  const expenseTrendDirection = expenseTrend.slope > 0 ? 'up' : 'down';

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Select value={forecastPeriod} onValueChange={setForecastPeriod}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">3 Monate Prognose</SelectItem>
            <SelectItem value="6">6 Monate Prognose</SelectItem>
            <SelectItem value="12">12 Monate Prognose</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Trend Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Ø Einnahmen</p>
                <p className="text-2xl font-bold text-green-600">
                  {avgIncome.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  {incomeTrendDirection === 'up' ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                  <span className={`text-xs ${incomeTrendDirection === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    Trend {incomeTrendDirection === 'up' ? 'steigend' : 'fallend'}
                  </span>
                </div>
              </div>
              <Activity className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Ø Ausgaben</p>
                <p className="text-2xl font-bold text-red-600">
                  {avgExpenses.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  {expenseTrendDirection === 'up' ? (
                    <TrendingUp className="w-4 h-4 text-red-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-green-600" />
                  )}
                  <span className={`text-xs ${expenseTrendDirection === 'up' ? 'text-red-600' : 'text-green-600'}`}>
                    Trend {expenseTrendDirection === 'up' ? 'steigend' : 'fallend'}
                  </span>
                </div>
              </div>
              <Activity className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Progn. Gewinn ({forecastPeriod}M)</p>
                <p className={`text-2xl font-bold ${(forecastTotalIncome - forecastTotalExpenses) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {(forecastTotalIncome - forecastTotalExpenses).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                </p>
                <Badge variant="outline" className="mt-2 text-xs">
                  Prognose
                </Badge>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Forecast Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Finanzprognose</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={combinedData}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value) => value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0' }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="income" 
                stroke="#10b981" 
                fillOpacity={1} 
                fill="url(#colorIncome)" 
                name="Einnahmen"
                strokeWidth={2}
                strokeDasharray={(d) => d.isHistorical ? "0" : "5 5"}
              />
              <Area 
                type="monotone" 
                dataKey="expenses" 
                stroke="#ef4444" 
                fillOpacity={1} 
                fill="url(#colorExpenses)" 
                name="Ausgaben"
                strokeWidth={2}
                strokeDasharray={(d) => d.isHistorical ? "0" : "5 5"}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-green-600"></div>
              <span>Historische Daten</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-green-600 border-dashed border-t-2 border-green-600"></div>
              <span>Prognose</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Forecast Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Prognose-Details (nächste {forecastPeriod} Monate)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Monat</th>
                  <th className="text-right p-2">Einnahmen</th>
                  <th className="text-right p-2">Ausgaben</th>
                  <th className="text-right p-2">Gewinn</th>
                </tr>
              </thead>
              <tbody>
                {forecastData.map((data, index) => (
                  <tr key={index} className="border-b hover:bg-slate-50">
                    <td className="p-2">{data.month}</td>
                    <td className="p-2 text-right text-green-600 font-medium">
                      {data.income.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </td>
                    <td className="p-2 text-right text-red-600 font-medium">
                      {data.expenses.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </td>
                    <td className={`p-2 text-right font-bold ${data.profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {data.profit.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-100 font-bold">
                  <td className="p-2">Gesamt</td>
                  <td className="p-2 text-right text-green-600">
                    {forecastTotalIncome.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  </td>
                  <td className="p-2 text-right text-red-600">
                    {forecastTotalExpenses.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  </td>
                  <td className={`p-2 text-right ${(forecastTotalIncome - forecastTotalExpenses) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {(forecastTotalIncome - forecastTotalExpenses).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}