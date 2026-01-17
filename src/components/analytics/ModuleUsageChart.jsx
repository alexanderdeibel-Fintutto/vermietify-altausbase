import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import SimpleBarChart from '@/components/charts/SimpleBarChart';
import { BarChart3 } from 'lucide-react';

export default function ModuleUsageChart() {
  const data = [
    { name: 'Objekte', value: 145 },
    { name: 'Mieter', value: 98 },
    { name: 'Verträge', value: 87 },
    { name: 'Finanzen', value: 156 },
    { name: 'Dokumente', value: 234 }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Modul-Nutzung
        </CardTitle>
      </CardHeader>
      <CardContent>
        <SimpleBarChart data={data} height={250} />
      </CardContent>
    </Card>
  );
}