import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StatCard({ 
  label, 
  value, 
  icon: Icon,
  trend,
  variant = 'default' 
}) {
  return (
    <Card className={variant === 'highlighted' ? 'vf-stat-card-highlighted' : ''}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-[var(--theme-text-secondary)]">{label}</span>
          {Icon && <Icon className="h-5 w-5 text-[var(--theme-text-muted)]" />}
        </div>
        
        <div className="text-3xl font-bold mb-2">{value}</div>
        
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-sm font-medium",
            trend.positive ? "text-[var(--vf-success-600)]" : "text-[var(--vf-error-600)]"
          )}>
            {trend.positive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {trend.value}% vs. Vormonat
          </div>
        )}
      </CardContent>
    </Card>
  );
}