import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const StatCard = ({ 
  label, 
  value, 
  icon: Icon, 
  trend, 
  trendValue,
  highlighted = false,
  className 
}) => {
  return (
    <div className={cn(
      highlighted ? "vf-stat-card-highlighted" : "vf-stat-card",
      className
    )}>
      <div className="vf-stat-card-header">
        <span className="vf-stat-card-label">{label}</span>
        {Icon && <Icon className="vf-stat-card-icon" />}
      </div>
      <div className="vf-stat-card-value">{value}</div>
      {trend && (
        <div className={cn(
          "vf-stat-card-trend",
          trend === 'positive' && 'positive',
          trend === 'negative' && 'negative',
          trend === 'neutral' && 'neutral'
        )}>
          {trend === 'positive' && <TrendingUp className="w-4 h-4" />}
          {trend === 'negative' && <TrendingDown className="w-4 h-4" />}
          {trendValue}
        </div>
      )}
    </div>
  );
};

export default StatCard;