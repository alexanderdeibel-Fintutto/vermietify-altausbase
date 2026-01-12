import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, PieChart as PieChartIcon, Plus } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function PortfolioDashboard() {
  const { data: portfolios = [], isLoading: portfoliosLoading } = useQuery({
    queryKey: ['portfolios'],
    queryFn: () => base44.entities.Portfolio.list(),
  });

  const { data: assets = [], isLoading: assetsLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: () => base44.entities.Asset.list(),
    enabled: portfolios.length > 0,
  });

  const { data: valuations = [] } = useQuery({
    queryKey: ['valuations'],
    queryFn: async () => {
      const vals = await base44.entities.AssetValuation.list('-valuation_date', 1000);
      return vals;
    },
    enabled: assets.length > 0,
  });

  // Berechnungen
  const totalValue = assets.reduce((sum, a) => sum + (a.current_value || 0), 0);
  const totalCost = assets.reduce((sum, a) => sum + (a.purchase_price_avg * a.quantity), 0);
  const totalGainLoss = totalValue - totalCost;
  const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

  // Asset-Allocation
  const assetAllocation = assets.reduce((acc, asset) => {
    const label = asset.asset_class;
    const existing = acc.find(a => a.name === label);
    if (existing) {
      existing.value += asset.current_value || 0;
    } else {
      acc.push({ name: label, value: asset.current_value || 0 });
    }
    return acc;
  }, []);

  // Performance-Chart (letzte 30 Tage)
  const last30Days = valuations
    .filter(v => {
      const vDate = new Date(v.valuation_date);
      const now = new Date();
      return (now - vDate) / (1000 * 60 * 60 * 24) <= 30;
    })
    .sort((a, b) => new Date(a.valuation_date) - new Date(b.valuation_date));

  const performanceData = last30Days.reduce((acc, val) => {
    const dateStr = val.valuation_date;
    const existing = acc.find(d => d.date === dateStr);
    if (existing) {
      existing.value += val.price * (assets.find(a => a.id === val.asset_id)?.quantity || 1);
    } else {
      acc.push({
        date: dateStr,
        value: val.price * (assets.find(a => a.id === val.asset_id)?.quantity || 1),
      });
    }
    return acc;
  }, []);

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

  if (portfoliosLoading || assetsLoading) {
    return <div className="p-6 text-center text-slate-600">Wird geladen...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Vermögensübersicht</h1>
          <p className="text-slate-600 mt-1">{portfolios.length} Portfolio(s), {assets.length} Assets</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Neues Portfolio
        </Button>
      </div>

      {/* Gesamt-Übersicht */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Gesamtvermögen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {totalValue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Gewinn/Verlust</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold flex items-center gap-2 ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalGainLoss >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              {Math.abs(totalGainLoss).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </div>
            <p className="text-xs text-slate-500 mt-1">{totalGainLossPercent.toFixed(2)}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Kosten Basis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {totalCost.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Anzahl Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{assets.length}</div>
            <p className="text-xs text-slate-500 mt-1">{portfolios.length} Portfolios</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asset Allocation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5" />
              Asset-Allokation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={assetAllocation} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${(value / totalValue * 100).toFixed(0)}%`} outerRadius={100} fill="#8884d8" dataKey="value">
                  {assetAllocation.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Performance (30 Tage)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} />
                <Line type="monotone" dataKey="value" stroke="#3b82f6" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Holdings */}
      <Card>
        <CardHeader>
          <CardTitle>Top Holdings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4 font-medium text-slate-600">Asset</th>
                  <th className="text-right py-2 px-4 font-medium text-slate-600">Menge</th>
                  <th className="text-right py-2 px-4 font-medium text-slate-600">Kurs</th>
                  <th className="text-right py-2 px-4 font-medium text-slate-600">Wert</th>
                  <th className="text-right py-2 px-4 font-medium text-slate-600">%</th>
                </tr>
              </thead>
              <tbody>
                {assets.slice(0, 10).map(asset => (
                  <tr key={asset.id} className="border-b hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-slate-900">{asset.name}</p>
                        <p className="text-xs text-slate-500">{asset.asset_class}</p>
                      </div>
                    </td>
                    <td className="text-right py-3 px-4">{asset.quantity}</td>
                    <td className="text-right py-3 px-4">
                      {(asset.current_price || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </td>
                    <td className="text-right py-3 px-4 font-medium">
                      {(asset.current_value || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </td>
                    <td className="text-right py-3 px-4">
                      <Badge>{((asset.current_value || 0) / totalValue * 100).toFixed(1)}%</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}