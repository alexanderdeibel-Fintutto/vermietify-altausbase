import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp } from 'lucide-react';

export default function FinancialForecastWidget() {
  const data = [
    { month: 'Jan', actual: 12000, forecast: 12500 },
    { month: 'Feb', actual: 11800, forecast: 12800 },
    { month: 'Mar', actual: 12400, forecast: 13100 },
    { month: 'Apr', forecast: 13200 },
    { month: 'Mai', forecast: 13500 },
    { month: 'Jun', forecast: 13800 }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Finanzprognose
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line type="monotone" dataKey="actual" stroke="var(--theme-primary)" strokeWidth={2} name="Ist" />
            <Line type="monotone" dataKey="forecast" stroke="var(--vf-accent-500)" strokeWidth={2} strokeDasharray="5 5" name="Prognose" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}