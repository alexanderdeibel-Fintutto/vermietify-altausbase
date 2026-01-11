import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BarChart, ArrowUp, ArrowDown } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function BenchmarkComparison({ companyId }) {
  const [metricsId, setMetricsId] = useState('');
  const [region, setRegion] = useState('Berlin');

  const compareMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('compareToBenchmark', {
        portfolio_metrics_id: metricsId,
        region
      })
  });

  const comparison = compareMutation.data?.data?.comparison;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart className="w-4 h-4" />
          Benchmark-Vergleich
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          placeholder="Portfolio-Metrics-ID"
          value={metricsId}
          onChange={(e) => setMetricsId(e.target.value)}
        />
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="Berlin">Berlin</option>
          <option value="München">München</option>
          <option value="Hamburg">Hamburg</option>
          <option value="Köln">Köln</option>
          <option value="Frankfurt">Frankfurt</option>
        </select>
        <Button
          onClick={() => compareMutation.mutate()}
          disabled={!metricsId}
          className="w-full"
        >
          Mit Branche vergleichen
        </Button>

        {comparison && (
          <div className="space-y-3 pt-3 border-t">
            <div className="text-center mb-3">
              <p className="text-xs text-slate-600 mb-2">Gesamtperformance</p>
              <div className="relative">
                <Progress value={comparison.overall_score} className="h-3" />
                <p className="text-sm font-bold mt-1">{comparison.overall_score}/100</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="p-3 border rounded">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Leerstandsquote</span>
                  {comparison.vacancy_rate.performance === 'better' ? 
                    <ArrowUp className="w-4 h-4 text-green-600" /> :
                    <ArrowDown className="w-4 h-4 text-red-600" />
                  }
                </div>
                <div className="flex justify-between text-xs">
                  <span>Sie: {comparison.vacancy_rate.yours}%</span>
                  <span>Branche: {comparison.vacancy_rate.industry}%</span>
                </div>
              </div>

              <div className="p-3 border rounded">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">ROI</span>
                  {comparison.roi.performance === 'better' ? 
                    <ArrowUp className="w-4 h-4 text-green-600" /> :
                    <ArrowDown className="w-4 h-4 text-red-600" />
                  }
                </div>
                <div className="flex justify-between text-xs">
                  <span>Sie: {comparison.roi.yours}%</span>
                  <span>Branche: {comparison.roi.industry}%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}