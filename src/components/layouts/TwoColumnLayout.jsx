import React from 'react';
import { cn } from '@/lib/utils';

export default function TwoColumnLayout({ 
  left, 
  right,
  leftWidth = '2/3',
  className 
}) {
  const gridClasses = {
    '1/2': 'lg:grid-cols-2',
    '1/3': 'lg:grid-cols-[1fr_2fr]',
    '2/3': 'lg:grid-cols-[2fr_1fr]'
  };

  return (
    <div className={cn(
      "grid grid-cols-1 gap-6",
      gridClasses[leftWidth],
      className
    )}>
      <div>{left}</div>
      <div>{right}</div>
    </div>
  );
}