import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import SimpleBarChart from '@/components/charts/SimpleBarChart';

export default function BenchmarkComparison({ userValue, benchmarkValue, label }) {
  const data = [
    { name: 'Ihre Immobilien', value: userValue },
    { name: 'Branchendurchschnitt', value: benchmarkValue }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          {label} - Benchmark
        </CardTitle>
      </CardHeader>
      <CardContent>
        <SimpleBarChart data={data} height={200} />
        <div className="mt-4 text-center">
          <div className="text-sm text-[var(--theme-text-secondary)]">
            {userValue > benchmarkValue ? (
              <span className="text-[var(--vf-success-600)] font-semibold">
                +{((userValue / benchmarkValue - 1) * 100).toFixed(1)}% über dem Durchschnitt
              </span>
            ) : (
              <span className="text-[var(--vf-error-600)] font-semibold">
                {((userValue / benchmarkValue - 1) * 100).toFixed(1)}% unter dem Durchschnitt
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}