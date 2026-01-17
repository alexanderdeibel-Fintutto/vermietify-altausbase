import React from 'react';
import { cn } from '@/lib/utils';

export default function ResponsiveContainer({ 
  children, 
  className,
  maxWidth = 'xl' 
}) {
  const maxWidthClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-5xl',
    xl: 'max-w-6xl',
    '2xl': 'max-w-7xl'
  };

  return (
    <div className={cn(
      "mx-auto px-4 sm:px-6 lg:px-8",
      maxWidthClasses[maxWidth],
      className
    )}>
      {children}
    </div>
  );
}