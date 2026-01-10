import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BarChart3 } from 'lucide-react';

export default function MarketBenchmarking() {
  const { data: benchmark } = useQuery({
    queryKey: ['marketBenchmark'],
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
          <BarChart3 className="w-5 h-5" />
          Markt-Benchmarking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {benchmark.metrics.map((metric, idx) => (
          <div key={idx} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{metric.name}</span>
              <span className="font-semibold">{metric.value}{metric.unit}</span>
            </div>
            <div className="flex items-center gap-2">
              <Progress value={metric.percentile} className="flex-1" />
              <Badge variant="outline">{metric.percentile}. Perzentil</Badge>
            </div>
            <p className="text-xs text-slate-600">{metric.comparison}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}