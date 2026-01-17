import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function VfBadge({ 
  variant = 'default',
  dot = false,
  children,
  className,
  ...props 
}) {
  return (
    <Badge 
      variant={variant}
      className={cn(
        dot && "vf-badge-dot",
        className
      )}
      {...props}
    >
      {children}
    </Badge>
  );
}