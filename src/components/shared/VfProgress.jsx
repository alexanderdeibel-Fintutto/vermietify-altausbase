import React from 'react';
import { cn } from '@/lib/utils';

export function VfProgress({ 
  value = 0, 
  max = 100, 
  size = 'md',
  variant = 'default',
  showValue = false,
  className 
}) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const sizeClasses = {
    sm: 'vf-progress-sm',
    md: '',
    lg: 'vf-progress-lg'
  };

  const variantClasses = {
    default: 'vf-progress-bar-default',
    gradient: 'vf-progress-bar-gradient',
    success: 'vf-progress-bar-success',
    warning: 'vf-progress-bar-warning',
    error: 'vf-progress-bar-error'
  };

  return (
    <div className="space-y-1">
      {showValue && (
        <div className="flex justify-between text-sm">
          <span className="text-[var(--theme-text-secondary)]">Fortschritt</span>
          <span className="font-semibold">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={cn("vf-progress", sizeClasses[size], className)}>
        <div 
          className={cn("vf-progress-bar", variantClasses[variant])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}