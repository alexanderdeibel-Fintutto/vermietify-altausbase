import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';

export default function CashflowSimulation() {
  const [rent, setRent] = useState('1000');
  const [expenses, setExpenses] = useState('300');
  const [appreciation, setAppreciation] = useState('2');

  const simulate = () => {
    const monthlyRent = parseFloat(rent) || 0;
    const monthlyExp = parseFloat(expenses) || 0;
    const appreciationRate = (parseFloat(appreciation) || 0) / 100;

    return Array.from({ length: 11 }, (_, year) => {
      const yearlyRent = monthlyRent * 12 * Math.pow(1 + appreciationRate, year);
      const yearlyExp = monthlyExp * 12 * Math.pow(1.02, year); // 2% expense increase
      
      return {
        year,
        income: Math.round(yearlyRent),
        expenses: Math.round(yearlyExp),
        cashflow: Math.round(yearlyRent - yearlyExp)
      };
    });
  };

  const data = simulate();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Cashflow-Simulation (10 Jahre)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <Input
            type="number"
            placeholder="Miete/Monat"
            value={rent}
            onChange={(e) => setRent(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Kosten/Monat"
            value={expenses}
            onChange={(e) => setExpenses(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Steigerung %"
            value={appreciation}
            onChange={(e) => setAppreciation(e.target.value)}
          />
        </div>

        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="income" fill="#10b981" name="Einnahmen" />
            <Bar dataKey="expenses" fill="#ef4444" name="Ausgaben" />
          </BarChart>
        </ResponsiveContainer>

        <div className="p-3 bg-green-50 rounded-lg">
          <p className="text-sm text-green-900">Cashflow Jahr 10:</p>
          <p className="text-2xl font-bold text-green-900">
            {data[10].cashflow.toLocaleString('de-DE')} €
          </p>
        </div>
      </CardContent>
    </Card>
  );
}