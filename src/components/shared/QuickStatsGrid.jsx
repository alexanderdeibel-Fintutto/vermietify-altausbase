import React from 'react';
import StatCard from '@/components/dashboard/StatCard';

export default function QuickStatsGrid({ stats = [] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
}