import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import SimpleBarChart from '@/components/charts/SimpleBarChart';
import { Activity } from 'lucide-react';

export default function UserActivityChart() {
  const data = [
    { name: 'Mo', value: 45 },
    { name: 'Di', value: 52 },
    { name: 'Mi', value: 38 },
    { name: 'Do', value: 60 },
    { name: 'Fr', value: 48 },
    { name: 'Sa', value: 15 },
    { name: 'So', value: 8 }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Aktivität diese Woche
        </CardTitle>
      </CardHeader>
      <CardContent>
        <SimpleBarChart data={data} height={200} />
        <div className="text-center mt-4">
          <div className="text-2xl font-bold">266</div>
          <div className="text-sm text-[var(--theme-text-muted)]">Aktionen insgesamt</div>
        </div>
      </CardContent>
    </Card>
  );
}