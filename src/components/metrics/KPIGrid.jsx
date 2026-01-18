import React from 'react';
import { VfStatCard } from '@/components/ui/vf-stat-card';

export default function KPIGrid({ kpis }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {kpis.map((kpi, index) => (
        <VfStatCard
          key={index}
          label={kpi.label}
          value={kpi.value}
          icon={kpi.icon}
          trend={kpi.trend}
          variant={kpi.variant}
        />
      ))}
    </div>
  );
}