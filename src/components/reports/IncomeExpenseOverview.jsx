import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, TrendingUp, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function IncomeExpenseOverview() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => base44.entities.LeaseContract.list()
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['payments', selectedYear],
    queryFn: () => base44.entities.Payment.list()
  });

  const { data: financialItems = [] } = useQuery({
    queryKey: ['financial-items', selectedYear],
    queryFn: () => base44.entities.FinancialItem.list()
  });

  // Calculate data per building
  const buildingFinancials = buildings.map(building => {
    const buildingContracts = contracts.filter(c => 
      c.building_id === building.id && c.status === 'active'
    );

    const monthlyIncome = buildingContracts.reduce((sum, c) => sum + (c.total_rent || 0), 0);
    const yearlyIncome = monthlyIncome * 12;

    const buildingExpenses = financialItems.filter(item => 
      item.building_id === building.id && 
      item.type === 'expense' &&
      new Date(item.date).getFullYear().toString() === selectedYear
    );

    const yearlyExpenses = buildingExpenses.reduce((sum, item) => 
      sum + (item.amount || 0), 0
    );

    return {
      id: building.id,
      name: building.name,
      income: yearlyIncome,
      expenses: yearlyExpenses,
      profit: yearlyIncome - yearlyExpenses,
      units: buildingContracts.length
    };
  });

  const totalIncome = buildingFinancials.reduce((sum, b) => sum + b.income, 0);
  const totalExpenses = buildingFinancials.reduce((sum, b) => sum + b.expenses, 0);
  const totalProfit = totalIncome - totalExpenses;

  const chartData = buildingFinancials.map(b => ({
    name: b.name.length > 15 ? b.name.substring(0, 15) + '...' : b.name,
    Einnahmen: b.income,
    Ausgaben: b.expenses,
    Gewinn: b.profit
  }));

  return (
    <div className="space-y-6">
      {/* Year Selection */}
      <div className="flex justify-end">
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[2024, 2025, 2026].map(year => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Gesamteinnahmen</p>
                <p className="text-3xl font-bold text-green-600">
                  {totalIncome.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Gesamtausgaben</p>
                <p className="text-3xl font-bold text-red-600">
                  {totalExpenses.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Nettogewinn</p>
                <p className={`text-3xl font-bold ${totalProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {totalProfit.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                </p>
              </div>
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Finanzübersicht pro Gebäude</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value) => value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              />
              <Legend />
              <Bar dataKey="Einnahmen" fill="#10b981" />
              <Bar dataKey="Ausgaben" fill="#ef4444" />
              <Bar dataKey="Gewinn" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detaillierte Übersicht</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 text-sm font-semibold">Gebäude</th>
                  <th className="text-right p-3 text-sm font-semibold">Einheiten</th>
                  <th className="text-right p-3 text-sm font-semibold">Einnahmen</th>
                  <th className="text-right p-3 text-sm font-semibold">Ausgaben</th>
                  <th className="text-right p-3 text-sm font-semibold">Gewinn</th>
                  <th className="text-right p-3 text-sm font-semibold">Rendite</th>
                </tr>
              </thead>
              <tbody>
                {buildingFinancials.map(building => {
                  const roi = building.income > 0 ? ((building.profit / building.income) * 100) : 0;
                  return (
                    <tr key={building.id} className="border-b hover:bg-slate-50">
                      <td className="p-3 text-sm font-medium">{building.name}</td>
                      <td className="p-3 text-sm text-right">{building.units}</td>
                      <td className="p-3 text-sm text-right text-green-600 font-medium">
                        {building.income.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                      </td>
                      <td className="p-3 text-sm text-right text-red-600 font-medium">
                        {building.expenses.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                      </td>
                      <td className={`p-3 text-sm text-right font-bold ${building.profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        {building.profit.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                      </td>
                      <td className="p-3 text-sm text-right">
                        <Badge variant={roi >= 0 ? 'default' : 'destructive'}>
                          {roi.toFixed(1)}%
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-slate-100 font-bold">
                  <td className="p-3 text-sm">Gesamt</td>
                  <td className="p-3 text-sm text-right">
                    {buildingFinancials.reduce((sum, b) => sum + b.units, 0)}
                  </td>
                  <td className="p-3 text-sm text-right text-green-600">
                    {totalIncome.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  </td>
                  <td className="p-3 text-sm text-right text-red-600">
                    {totalExpenses.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  </td>
                  <td className={`p-3 text-sm text-right ${totalProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {totalProfit.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  </td>
                  <td className="p-3 text-sm text-right">
                    <Badge variant={totalProfit >= 0 ? 'default' : 'destructive'}>
                      {((totalProfit / totalIncome) * 100).toFixed(1)}%
                    </Badge>
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