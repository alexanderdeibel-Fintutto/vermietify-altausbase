import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function RentPriceTrend() {
  const data = [
    { month: 'Jan', avg: 850 },
    { month: 'Feb', avg: 855 },
    { month: 'Mär', avg: 860 },
    { month: 'Apr', avg: 870 },
    { month: 'Mai', avg: 880 },
    { month: 'Jun', avg: 895 }
  ];

  const trend = ((data[data.length - 1].avg - data[0].avg) / data[0].avg) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Mietpreis-Entwicklung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-center">
          <p className="text-xs text-slate-600">Durchschnitt</p>
          <p className="text-2xl font-bold text-blue-600">{data[data.length - 1].avg}€</p>
          <p className="text-xs text-green-600">+{trend.toFixed(1)}% (6 Monate)</p>
        </div>

        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="avg" stroke="#3b82f6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}