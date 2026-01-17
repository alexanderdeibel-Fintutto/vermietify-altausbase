import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function PercentageDisplay({ 
  value, 
  showIcon = false,
  colored = true,
  decimals = 1,
  className 
}) {
  const isPositive = value > 0;
  const isNegative = value < 0;

  return (
    <span className={cn(
      "inline-flex items-center gap-1 font-semibold",
      colored && isPositive && "text-[var(--vf-success-600)]",
      colored && isNegative && "text-[var(--vf-error-600)]",
      className
    )}>
      {showIcon && isPositive && <TrendingUp className="h-4 w-4" />}
      {showIcon && isNegative && <TrendingDown className="h-4 w-4" />}
      {isPositive && '+'}
      {value.toFixed(decimals)}%
    </span>
  );
}