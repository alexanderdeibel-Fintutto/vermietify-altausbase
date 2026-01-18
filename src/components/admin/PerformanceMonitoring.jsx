import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Gauge } from 'lucide-react';

export default function PerformanceMonitoring() {
  const data = [
    { time: '00:00', response: 45 },
    { time: '04:00', response: 38 },
    { time: '08:00', response: 52 },
    { time: '12:00', response: 67 },
    { time: '16:00', response: 48 },
    { time: '20:00', response: 41 }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="h-5 w-5" />
          Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="text-2xl font-bold">48ms</div>
          <div className="text-sm text-[var(--theme-text-muted)]">Durchschnittliche Antwortzeit</div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <XAxis dataKey="time" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line type="monotone" dataKey="response" stroke="var(--theme-primary)" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}