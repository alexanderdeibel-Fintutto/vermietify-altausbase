import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import SimpleBarChart from '@/components/charts/SimpleBarChart';
import { Activity } from 'lucide-react';

export default function PerformanceMonitoring() {
  const data = [
    { name: 'API', value: 45 },
    { name: 'DB', value: 12 },
    { name: 'ELSTER', value: 230 },
    { name: 'Letter', value: 156 }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Performance Monitoring
        </CardTitle>
      </CardHeader>
      <CardContent>
        <SimpleBarChart 
          data={data}
          dataKey="value"
          xKey="name"
          height={200}
        />
        <div className="text-xs text-[var(--theme-text-muted)] text-center mt-2">
          Durchschnittliche Latenz in ms
        </div>
      </CardContent>
    </Card>
  );
}