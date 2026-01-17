import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import SimpleLineChart from '@/components/charts/SimpleLineChart';
import { Activity } from 'lucide-react';

export default function UserActivityChart() {
  const data = [
    { name: 'Mo', value: 45 },
    { name: 'Di', value: 52 },
    { name: 'Mi', value: 38 },
    { name: 'Do', value: 61 },
    { name: 'Fr', value: 58 },
    { name: 'Sa', value: 24 },
    { name: 'So', value: 18 }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Benutzeraktivität
        </CardTitle>
      </CardHeader>
      <CardContent>
        <SimpleLineChart data={data} height={200} />
      </CardContent>
    </Card>
  );
}