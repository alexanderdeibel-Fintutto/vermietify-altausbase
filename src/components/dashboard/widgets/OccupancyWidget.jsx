import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Home } from 'lucide-react';

const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

export default function OccupancyWidget() {
  const data = [
    { name: 'Vermietet', value: 28 },
    { name: 'Geplant', value: 2 },
    { name: 'Leer', value: 2 }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Home className="w-4 h-4" />
          Belegung
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={150}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={2} dataKey="value">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-3 space-y-1 text-xs">
          {data.map((item, i) => (
            <div key={i} className="flex justify-between">
              <span className="text-slate-600">{item.name}</span>
              <span className="font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}