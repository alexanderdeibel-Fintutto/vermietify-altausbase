import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Zap } from 'lucide-react';

export default function WealthSimulator() {
  const [initial, setInitial] = useState('50000');
  const [monthly, setMonthly] = useState('1000');
  const [scenario, setScenario] = useState('balanced');

  const scenarios = {
    conservative: { return: 4, risk: 'Niedrig' },
    balanced: { return: 7, risk: 'Mittel' },
    aggressive: { return: 10, risk: 'Hoch' }
  };

  const simulate = () => {
    const P = parseFloat(initial) || 0;
    const M = parseFloat(monthly) || 0;
    const r = scenarios[scenario].return / 100;

    return Array.from({ length: 31 }, (_, year) => {
      const compound = P * Math.pow(1 + r, year);
      const savings = M * 12 * ((Math.pow(1 + r, year) - 1) / r) * (1 + r);
      return {
        year,
        value: Math.round(compound + savings)
      };
    });
  };

  const projection = simulate();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Vermögensaufbau-Simulator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
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
          <Select value={scenario} onValueChange={setScenario}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="conservative">Konservativ</SelectItem>
              <SelectItem value="balanced">Ausgewogen</SelectItem>
              <SelectItem value="aggressive">Aggressiv</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xs text-blue-900">10 Jahre</p>
              <p className="font-bold text-blue-900">{projection[10].value.toLocaleString('de-DE')}€</p>
            </div>
            <div>
              <p className="text-xs text-blue-900">20 Jahre</p>
              <p className="font-bold text-blue-900">{projection[20].value.toLocaleString('de-DE')}€</p>
            </div>
            <div>
              <p className="text-xs text-blue-900">30 Jahre</p>
              <p className="font-bold text-blue-900">{projection[30].value.toLocaleString('de-DE')}€</p>
            </div>
          </div>
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