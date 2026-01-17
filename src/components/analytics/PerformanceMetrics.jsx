import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Activity } from 'lucide-react';
import { VfProgress } from '@/components/shared/VfProgress';

export default function PerformanceMetrics() {
  const metrics = [
    { label: 'Datenbank-Performance', value: 98, target: 95 },
    { label: 'API-Antwortzeit', value: 92, target: 90 },
    { label: 'Verfügbarkeit', value: 99.9, target: 99.5 }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Performance-Metriken
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {metrics.map((metric, index) => (
            <div key={index}>
              <div className="flex justify-between mb-2">
                <span className="text-sm">{metric.label}</span>
                <span className="text-sm font-bold">{metric.value}%</span>
              </div>
              <VfProgress value={metric.value} max={100} variant="success" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}