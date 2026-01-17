import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export function VfStatCard({ 
  label, 
  value, 
  trend,
  trendLabel,
  icon: Icon,
  variant = 'default',
  className 
}) {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend === 'up') return <TrendingUp className="h-4 w-4" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

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
          trend === 'up' && "positive",
          trend === 'down' && "negative",
          trend === 'neutral' && "neutral"
        )}>
          {getTrendIcon()}
          <span>{trendLabel || trend}</span>
        </div>
      )}
    </div>
  );
}