import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import SimpleLineChart from '@/components/charts/SimpleLineChart';
import { TrendingUp } from 'lucide-react';

export default function TrendAnalysisChart({ data = [], title = 'Trend-Analyse' }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <SimpleLineChart data={data} height={250} />
      </CardContent>
    </Card>
  );
}