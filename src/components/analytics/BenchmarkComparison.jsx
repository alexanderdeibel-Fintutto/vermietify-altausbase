import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function BenchmarkComparison() {
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
        <CardTitle>Benchmark-Vergleich</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {benchmark.metrics.map((metric, idx) => (
          <div key={idx} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">{metric.name}</span>
              <div className="flex items-center gap-2">
                {metric.performance > 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <Badge className={metric.performance > 0 ? 'bg-green-600' : 'bg-red-600'}>
                  {metric.performance > 0 ? '+' : ''}{metric.performance}%
                </Badge>
              </div>
            </div>
            <Progress value={metric.percentile} />
            <p className="text-xs text-slate-600">
              {metric.percentile}. Perzentil
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}