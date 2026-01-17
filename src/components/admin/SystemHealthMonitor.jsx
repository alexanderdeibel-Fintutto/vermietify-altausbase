import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Activity, CheckCircle, AlertCircle } from 'lucide-react';
import { VfProgress } from '@/components/shared/VfProgress';

export default function SystemHealthMonitor() {
  const healthMetrics = [
    { name: 'API Performance', status: 'healthy', value: 98 },
    { name: 'Database', status: 'healthy', value: 100 },
    { name: 'Storage', status: 'warning', value: 75 },
    { name: 'Background Jobs', status: 'healthy', value: 95 }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          System-Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {healthMetrics.map((metric) => (
            <div key={metric.name}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {metric.status === 'healthy' ? (
                    <CheckCircle className="h-4 w-4 text-[var(--vf-success-500)]" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-[var(--vf-warning-500)]" />
                  )}
                  <span className="text-sm font-medium">{metric.name}</span>
                </div>
                <span className="text-sm font-semibold">{metric.value}%</span>
              </div>
              <VfProgress 
                value={metric.value} 
                max={100} 
                variant={metric.value >= 90 ? 'success' : 'warning'} 
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}