import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BarChart2 } from 'lucide-react';

export default function MarketBenchmarking() {
  const { data: benchmark } = useQuery({
    queryKey: ['benchmark'],
    queryFn: async () => {
      const response = await base44.functions.invoke('calculateBenchmark', {});
      return response.data;
    }
  });

  if (!benchmark) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart2 className="w-5 h-5" />
          Markt-Benchmarking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-blue-50 rounded-lg text-center">
          <p className="text-sm text-slate-600">Ihre Position</p>
          <Badge className="bg-blue-600 text-xl">Top {benchmark.percentile}%</Badge>
        </div>
        <div className="space-y-3">
          {benchmark.metrics.map((metric, idx) => (
            <div key={idx}>
              <div className="flex justify-between text-xs mb-1">
                <span>{metric.name}</span>
                <span>{metric.value} vs. {metric.market_avg} (Markt)</span>
              </div>
              <Progress value={metric.score} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}