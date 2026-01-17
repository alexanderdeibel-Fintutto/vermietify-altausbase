import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VfProgress } from '@/components/shared/VfProgress';
import { Gauge } from 'lucide-react';

export default function PerformanceMetrics({ metrics = [] }) {
  const defaultMetrics = [
    { label: 'Zahlungspünktlichkeit', value: 94, target: 95 },
    { label: 'Belegungsrate', value: 88, target: 90 },
    { label: 'Kundenzufriedenheit', value: 4.6, target: 4.5, isRating: true }
  ];

  const items = metrics.length > 0 ? metrics : defaultMetrics;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="h-5 w-5" />
          Performance-Kennzahlen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((metric, index) => {
          const percentage = metric.isRating 
            ? (metric.value / 5) * 100 
            : (metric.value / metric.target) * 100;
          
          const variant = percentage >= 100 ? 'success' : percentage >= 80 ? 'default' : 'warning';

          return (
            <div key={index}>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">{metric.label}</span>
                <span className="font-semibold">
                  {metric.isRating ? `${metric.value}/5` : `${metric.value}%`}
                </span>
              </div>
              <VfProgress value={percentage} max={100} variant={variant} />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}