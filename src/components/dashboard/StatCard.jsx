import React from 'react';
import { VfStatCard } from '@/components/ui/vf-stat-card';

export default function StatCard({ label, value, icon, trend, variant }) {
  return (
    <VfStatCard
      label={label}
      value={value}
      icon={icon}
      trend={trend}
      variant={variant}
    />
  );
}