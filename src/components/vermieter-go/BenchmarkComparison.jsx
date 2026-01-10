import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart2 } from 'lucide-react';

export default function BenchmarkComparison() {
  const metrics = [
    { name: 'Miete/m²', yours: 12.5, market: 11.8, unit: '€' },
    { name: 'Leerstand', yours: 2.5, market: 4.2, unit: '%', inverse: true },
    { name: 'Nebenkosten', yours: 2.8, market: 3.1, unit: '€', inverse: true },
    { name: 'ROI', yours: 6.4, market: 5.8, unit: '%' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart2 className="w-4 h-4" />
          Benchmark-Vergleich
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {metrics.map(metric => {
          const isBetter = metric.inverse 
            ? metric.yours < metric.market 
            : metric.yours > metric.market;
          
          return (
            <div key={metric.name}>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-semibold">{metric.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs">Du: {metric.yours}{metric.unit}</span>
                  <span className="text-xs text-slate-600">Markt: {metric.market}{metric.unit}</span>
                  <Badge className={isBetter ? 'bg-green-600' : 'bg-orange-600'}>
                    {isBetter ? '✓' : '!'}
                  </Badge>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}