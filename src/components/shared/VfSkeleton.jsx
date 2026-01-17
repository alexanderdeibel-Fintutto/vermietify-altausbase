import React from 'react';
import { cn } from '@/lib/utils';

export function VfSkeleton({ 
  variant = 'rectangular',
  width,
  height,
  lines = 1,
  className 
}) {
  if (variant === 'text') {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div 
            key={i}
            className={cn("vf-skeleton vf-skeleton-text", className)}
            style={{ width: i === lines - 1 ? '60%' : '100%' }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'title') {
    return (
      <div className={cn("vf-skeleton vf-skeleton-title", className)} />
    );
  }

  const style = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div 
      className={cn(
        "vf-skeleton",
        variant === 'circular' && "vf-skeleton-circular",
        className
      )}
      style={style}
    />
  );
}