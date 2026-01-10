import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function CompoundInterestCalculator() {
  const [initial, setInitial] = useState('10000');
  const [monthly, setMonthly] = useState('500');
  const [rate, setRate] = useState('7');
  const [years, setYears] = useState('20');

  const calculateProjection = () => {
    const P = parseFloat(initial) || 0;
    const M = parseFloat(monthly) || 0;
    const r = (parseFloat(rate) || 0) / 100;
    const y = parseInt(years) || 1;

    const data = [];
    for (let year = 0; year <= y; year++) {
      const compoundValue = P * Math.pow(1 + r, year);
      const monthlyValue = M * ((Math.pow(1 + r, year) - 1) / r) * (1 + r);
      const total = compoundValue + monthlyValue;
      
      data.push({
        year,
        value: Math.round(total)
      });
    }
    return data;
  };

  const projection = calculateProjection();
  const finalValue = projection[projection.length - 1].value;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Zinseszins-Rechner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            type="number"
            placeholder="Startkapital"
            value={initial}
            onChange={(e) => setInitial(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Mtl. Sparrate"
            value={monthly}
            onChange={(e) => setMonthly(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Rendite %"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Jahre"
            value={years}
            onChange={(e) => setYears(e.target.value)}
          />
        </div>

        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
          <p className="text-sm text-slate-700">Endkapital nach {years} Jahren:</p>
          <p className="text-3xl font-bold text-blue-900">{finalValue.toLocaleString('de-DE')} €</p>
        </div>

        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={projection}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}