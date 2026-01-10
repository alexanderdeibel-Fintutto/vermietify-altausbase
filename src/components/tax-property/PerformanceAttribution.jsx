import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

export default function PerformanceAttribution() {
  const data = [
    { source: 'Immobilien', contribution: 4.2 },
    { source: 'Aktien', contribution: 8.5 },
    { source: 'Anleihen', contribution: 2.1 },
    { source: 'Dividenden', contribution: 3.8 },
    { source: 'Zinsen', contribution: 0.9 }
  ];

  const totalReturn = data.reduce((sum, d) => sum + d.contribution, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Performance-Attribution
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
          <p className="text-sm text-green-900">Gesamtrendite (YTD)</p>
          <p className="text-4xl font-bold text-green-900">+{totalReturn.toFixed(1)}%</p>
        </div>

        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="source" type="category" width={100} />
            <Tooltip />
            <Bar dataKey="contribution" fill="#10b981" name="Beitrag %" />
          </BarChart>
        </ResponsiveContainer>

        <div className="space-y-2">
          {data.sort((a, b) => b.contribution - a.contribution).map(item => (
            <div key={item.source} className="flex justify-between p-2 bg-slate-50 rounded">
              <span className="text-sm">{item.source}</span>
              <span className="font-semibold text-green-600">+{item.contribution}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}