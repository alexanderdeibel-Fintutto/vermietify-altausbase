import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { BarChart3 } from 'lucide-react';

export default function RevenueWidget() {
  const data = [
    { month: 'Jan', income: 12000, expenses: 4200 },
    { month: 'Feb', income: 13200, expenses: 4400 },
    { month: 'Mär', income: 12800, expenses: 4300 },
    { month: 'Apr', income: 14100, expenses: 4600 },
    { month: 'Mai', income: 15200, expenses: 4800 },
    { month: 'Jun', income: 15800, expenses: 5000 }
  ];

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Einnahmen vs. Ausgaben
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" fontSize={12} stroke="#94a3b8" />
            <YAxis fontSize={12} stroke="#94a3b8" />
            <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="expenses" stroke="#f59e0b" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}