import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function AnalyticsPanel({ portfolio = [] }) {
  // Calculate analytics
  const totalValue = portfolio.reduce((sum, a) => sum + (a.quantity * a.current_value), 0);
  const totalInvested = portfolio.reduce((sum, a) => sum + (a.quantity * a.purchase_price), 0);
  const totalGain = totalValue - totalInvested;
  const gainPercent = (totalGain / totalInvested) * 100;

  // Category breakdown
  const byCategory = {};
  for (const asset of portfolio) {
    const cat = asset.asset_category;
    if (!byCategory[cat]) byCategory[cat] = { count: 0, value: 0, gain: 0 };
    byCategory[cat].count += 1;
    byCategory[cat].value += asset.quantity * asset.current_value;
    byCategory[cat].gain += (asset.quantity * asset.current_value) - (asset.quantity * asset.purchase_price);
  }

  const categoryData = Object.entries(byCategory).map(([cat, data]) => ({
    category: cat,
    positions: data.count,
    value: data.value,
    gain_percent: (data.gain / (data.value - data.gain)) * 100
  }));

  // Top performers
  const topPerformers = [...portfolio]
    .map(a => ({
      name: a.name,
      gain_percent: ((a.current_value - a.purchase_price) / a.purchase_price) * 100,
      value: a.quantity * a.current_value
    }))
    .sort((a, b) => b.gain_percent - a.gain_percent)
    .slice(0, 5);

  // Concentration
  const concentration = portfolio.map(a => ({
    name: a.name,
    percent: (a.quantity * a.current_value) / totalValue * 100
  })).sort((a, b) => b.percent - a.percent);

  const topConcentration = concentration.slice(0, 5);
  const diversificationScore = concentration.length > 10 ? 85 : 
                               concentration.length > 5 ? 70 : 
                               concentration.length > 3 ? 55 : 40;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-slate-600">Gesamtwert</p>
            <p className="text-2xl font-medium text-slate-900 mt-2">{(totalValue / 1000).toFixed(1)}k€</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-slate-600">Gewinn/Verlust</p>
            <p className={`text-2xl font-medium ${totalGain >= 0 ? 'text-green-600' : 'text-red-600'} mt-2`}>
              {gainPercent.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-slate-600">Positionen</p>
            <p className="text-2xl font-medium text-slate-900 mt-2">{portfolio.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-slate-600">Diversifikation</p>
            <p className="text-2xl font-medium text-slate-900 mt-2">{diversificationScore}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Category */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Nach Kategorie</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" name="Wert (€)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Performer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPerformers.map((asset, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                  <div>
                    <p className="text-sm font-light truncate">{asset.name}</p>
                    <p className="text-xs text-slate-500">{(asset.value / 1000).toFixed(1)}k€</p>
                  </div>
                  <Badge className={asset.gain_percent >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {asset.gain_percent > 0 ? '+' : ''}{asset.gain_percent.toFixed(1)}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Concentration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Portfolio-Konzentration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {topConcentration.map((asset, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <p className="text-sm font-light truncate">{asset.name}</p>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-slate-100 rounded">
                    <div className="h-full bg-blue-500 rounded" style={{ width: `${asset.percent}%` }} />
                  </div>
                  <span className="text-sm font-light w-12 text-right">{asset.percent.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}