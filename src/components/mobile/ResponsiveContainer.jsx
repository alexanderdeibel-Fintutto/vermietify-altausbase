import React from 'react';
import { cn } from '@/lib/utils';

export default function ResponsiveContainer({ children, className }) {
  return (
    <div className={cn('w-full px-4 md:px-6 lg:px-8', className)}>
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </div>
  );
}