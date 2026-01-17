import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import SimpleBarChart from '@/components/charts/SimpleBarChart';
import { BarChart3 } from 'lucide-react';

export default function RevenueChartWidget() {
  const data = [
    { name: 'Jan', value: 15000 },
    { name: 'Feb', value: 15500 },
    { name: 'Mär', value: 14800 },
    { name: 'Apr', value: 16200 },
    { name: 'Mai', value: 15900 },
    { name: 'Jun', value: 17100 }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Mieteinnahmen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <SimpleBarChart data={data} height={200} />
      </CardContent>
    </Card>
  );
}