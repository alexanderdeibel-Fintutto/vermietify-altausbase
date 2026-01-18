import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export default function QuickStatsGrid({ stats, className }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className || ''}`}>
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              {stat.icon && (
                <div className="w-12 h-12 bg-gradient-to-br from-[var(--vf-primary-600)] to-[var(--vf-accent-500)] rounded-lg flex items-center justify-center">
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              )}
              <div>
                <div className="text-3xl font-bold">{stat.value}</div>
                <div className="text-sm text-[var(--theme-text-muted)]">{stat.label}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}