import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import SimpleLineChart from '@/components/charts/SimpleLineChart';
import { TrendingUp, TrendingDown } from 'lucide-react';
import PercentageDisplay from '@/components/shared/PercentageDisplay';

export default function TrendAnalysis({ metric = 'revenue' }) {
  const data = [
    { name: 'Q1', value: 45000 },
    { name: 'Q2', value: 48500 },
    { name: 'Q3', value: 46800 },
    { name: 'Q4', value: 52000 }
  ];

  const trend = 8.5;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Trend-Analyse</span>
          <div className="flex items-center gap-2">
            {trend > 0 ? (
              <TrendingUp className="h-5 w-5 text-[var(--vf-success-600)]" />
            ) : (
              <TrendingDown className="h-5 w-5 text-[var(--vf-error-600)]" />
            )}
            <PercentageDisplay value={trend} className="font-bold" />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <SimpleLineChart data={data} height={200} />
      </CardContent>
    </Card>
  );
}