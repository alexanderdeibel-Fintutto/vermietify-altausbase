import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import SimpleLineChart from '@/components/charts/SimpleLineChart';
import { TrendingUp } from 'lucide-react';

export default function FinancialForecastWidget() {
  const data = [
    { name: 'Q1', Einnahmen: 45000, Ausgaben: 28000 },
    { name: 'Q2', Einnahmen: 48000, Ausgaben: 29500 },
    { name: 'Q3', Einnahmen: 46500, Ausgaben: 27800 },
    { name: 'Q4', Einnahmen: 51000, Ausgaben: 31200 }
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
        <SimpleLineChart data={data} height={250} />
      </CardContent>
    </Card>
  );
}