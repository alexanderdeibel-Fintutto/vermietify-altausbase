import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { Activity } from 'lucide-react';

export default function UsageAnalyticsWidget() {
  const data = [
    { name: 'Mo', value: 12 },
    { name: 'Di', value: 19 },
    { name: 'Mi', value: 15 },
    { name: 'Do', value: 22 },
    { name: 'Fr', value: 18 },
    { name: 'Sa', value: 8 },
    { name: 'So', value: 5 }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Aktivität (7 Tage)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Bar dataKey="value" fill="var(--theme-primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}