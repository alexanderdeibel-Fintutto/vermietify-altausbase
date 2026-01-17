import React from 'react';
import { VfStatCard } from '@/components/dashboards/VfStatCard';
import { cn } from '@/lib/utils';

export default function StatGrid({ stats = [], columns = 4, className }) {
  return (
    <div className={cn(
      "grid gap-4",
      columns === 2 && "grid-cols-1 md:grid-cols-2",
      columns === 3 && "grid-cols-1 md:grid-cols-3",
      columns === 4 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
      className
    )}>
      {stats.map((stat, index) => (
        <VfStatCard key={index} {...stat} />
      ))}
    </div>
  );
}