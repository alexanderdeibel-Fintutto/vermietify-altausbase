import React from 'react';
import { cn } from '@/lib/utils';

export function VfAvatar({ 
  src, 
  alt, 
  fallback, 
  size = 'md',
  status,
  className 
}) {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl'
  };

  const statusColors = {
    online: 'bg-[var(--vf-success-500)]',
    offline: 'bg-[var(--vf-neutral-400)]',
    busy: 'bg-[var(--vf-error-500)]',
    away: 'bg-[var(--vf-warning-500)]'
  };

  const initials = fallback || (alt ? alt.substring(0, 2).toUpperCase() : '??');

  return (
    <div className={cn("relative inline-block", className)}>
      {src ? (
        <img 
          src={src} 
          alt={alt} 
          className={cn(
            "rounded-full object-cover",
            sizeClasses[size]
          )}
        />
      ) : (
        <div className={cn(
          "rounded-full bg-[var(--vf-gradient-primary)] text-white font-semibold flex items-center justify-center",
          sizeClasses[size]
        )}>
          {initials}
        </div>
      )}
      
      {status && (
        <div className={cn(
          "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white",
          statusColors[status]
        )} />
      )}
    </div>
  );
}