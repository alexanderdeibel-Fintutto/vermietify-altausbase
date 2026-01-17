import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function KPIGrid({ metrics = [] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[var(--theme-text-muted)]">{metric.label}</span>
                {Icon && <Icon className="h-4 w-4 text-[var(--theme-text-muted)]" />}
              </div>
              <div className="text-2xl font-bold">{metric.value}</div>
              {metric.change && (
                <div className={cn(
                  "text-xs mt-1 flex items-center gap-1",
                  metric.change > 0 ? "text-[var(--vf-success-600)]" : "text-[var(--vf-error-600)]"
                )}>
                  {metric.change > 0 ? '↑' : '↓'} {Math.abs(metric.change)}%
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}