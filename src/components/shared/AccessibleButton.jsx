import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function AccessibleButton({ 
  children, 
  ariaLabel, 
  className,
  ...props 
}) {
  return (
    <Button
      aria-label={ariaLabel}
      className={cn("min-h-[44px] min-w-[44px]", className)}
      {...props}
    >
      {children}
    </Button>
  );
}