import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

export default function AdvancedAnalyticsDashboard({ userId }) {
  const { data: portfolio = [] } = useQuery({
    queryKey: ['portfolio', userId],
    queryFn: () => base44.entities.AssetPortfolio.filter({ user_id: userId }) || []
  });

  const { data: performanceData = [] } = useQuery({
    queryKey: ['performance', userId],
    queryFn: () => base44.entities.AssetPerformanceHistory.filter({ user_id: userId }, '-date', 30) || []
  });

  // Calculate analytics
  const totalReturn = portfolio.reduce((sum, p) => sum + ((p.current_value - p.purchase_price) * p.quantity), 0);
  const volatility = performanceData.length > 1 
    ? Math.sqrt(performanceData.reduce((sum, d, i, arr) => {
        if (i === 0) return 0;
        const change = (arr[i].value_per_unit - arr[i-1].value_per_unit) / arr[i-1].value_per_unit;
        return sum + Math.pow(change, 2);
      }, 0) / performanceData.length)
    : 0;

  const sharpeRatio = volatility > 0 ? (totalReturn / 10000) / volatility : 0;
  const categoryRisk = portfolio.reduce((acc, p) => {
    acc[p.asset_category] = (acc[p.asset_category] || 0) + (p.current_value * p.quantity);
    return acc;
  }, {});

  const riskScore = Math.min(100, Object.values(categoryRisk).length > 3 ? 35 : 65);

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600">Total Return</p>
                <p className="text-2xl font-bold text-green-600">{(totalReturn / 1000).toFixed(1)}k€</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600">Volatilität</p>
                <p className="text-2xl font-bold">{(volatility * 100).toFixed(1)}%</p>
              </div>
              <TrendingDown className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-xs text-slate-600">Sharpe Ratio</p>
              <p className="text-2xl font-bold">{sharpeRatio.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600">Risk Score</p>
                <p className="text-2xl font-bold text-blue-600">{riskScore}/100</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Over Time */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Performance (letzte 30 Tage)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData.slice().reverse()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total_value" stroke="#3b82f6" name="Gesamtwert" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category Risk Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Risiko nach Kategorie</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={Object.entries(categoryRisk).map(([cat, val]) => ({ category: cat, value: val }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}