import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import BenchmarkComparison from './BenchmarkComparison';
import { TrendingUp } from 'lucide-react';

export default function MarketBenchmarking() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Markt-Benchmark
        </CardTitle>
      </CardHeader>
      <CardContent>
        <BenchmarkComparison />
      </CardContent>
    </Card>
  );
}