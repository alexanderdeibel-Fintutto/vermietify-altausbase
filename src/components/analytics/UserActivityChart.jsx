import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity } from 'lucide-react';

export default function UserActivityChart() {
  const data = [
    { day: 'Mo', activities: 12 },
    { day: 'Di', activities: 19 },
    { day: 'Mi', activities: 15 },
    { day: 'Do', activities: 22 },
    { day: 'Fr', activities: 18 },
    { day: 'Sa', activities: 8 },
    { day: 'So', activities: 5 }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Aktivitäten diese Woche
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" />
            <XAxis dataKey="day" stroke="var(--theme-text-muted)" />
            <YAxis stroke="var(--theme-text-muted)" />
            <Tooltip />
            <Bar dataKey="activities" fill="var(--theme-primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}