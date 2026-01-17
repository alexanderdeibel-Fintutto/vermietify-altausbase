import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PieChart } from 'lucide-react';

export default function IncomeExpenseChart() {
  const data = [
    { month: 'Jan', Einnahmen: 15000, Ausgaben: 8500 },
    { month: 'Feb', Einnahmen: 15500, Ausgaben: 9200 },
    { month: 'Mär', Einnahmen: 14800, Ausgaben: 7800 },
    { month: 'Apr', Einnahmen: 16200, Ausgaben: 10100 },
    { month: 'Mai', Einnahmen: 15900, Ausgaben: 8900 },
    { month: 'Jun', Einnahmen: 17100, Ausgaben: 9500 }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          Einnahmen vs. Ausgaben
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" />
            <XAxis dataKey="month" stroke="var(--theme-text-muted)" />
            <YAxis stroke="var(--theme-text-muted)" />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'var(--theme-elevated)',
                border: '1px solid var(--theme-border)',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Bar dataKey="Einnahmen" fill="#16A34A" />
            <Bar dataKey="Ausgaben" fill="#EF4444" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}