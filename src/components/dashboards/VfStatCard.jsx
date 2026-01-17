import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function VfStatCard({ 
  label, 
  value, 
  trend,
  trendLabel,
  icon: Icon,
  variant = 'default',
  className 
}) {
  const isPositive = trend && trend > 0;
  const isNegative = trend && trend < 0;

  return (
    <div className={cn(
      "vf-stat-card",
      variant === 'highlighted' && "vf-stat-card-highlighted",
      className
    )}>
      <div className="vf-stat-card-header">
        <div className="vf-stat-card-label">{label}</div>
        {Icon && <Icon className="vf-stat-card-icon" />}
      </div>
      
      <div className="vf-stat-card-value">{value}</div>
      
      {(trend || trendLabel) && (
        <div className={cn(
          "vf-stat-card-trend",
          isPositive && "positive",
          isNegative && "negative",
          !trend && "neutral"
        )}>
          {isPositive && <TrendingUp className="h-4 w-4" />}
          {isNegative && <TrendingDown className="h-4 w-4" />}
          <span>{trendLabel || `${trend > 0 ? '+' : ''}${trend}%`}</span>
        </div>
      )}
    </div>
  );
}