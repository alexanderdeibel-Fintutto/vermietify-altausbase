import React from 'react';
import QuickStatsWidget from './widgets/QuickStatsWidget';
import BuildingsWidget from './widgets/BuildingsWidget';
import TenantsWidget from './widgets/TenantsWidget';
import RevenueChartWidget from './widgets/RevenueChartWidget';
import QuickActionsWidget from '@/components/widgets/QuickActionsWidget';
import NewFeaturesWidget from './NewFeaturesWidget';

export default function PersonalDashboard() {
  return (
    <div className="space-y-6">
      <QuickStatsWidget />

      <div className="grid lg:grid-cols-3 gap-6">
        <BuildingsWidget />
        <TenantsWidget />
        <QuickActionsWidget />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <RevenueChartWidget />
        <NewFeaturesWidget />
      </div>
    </div>
  );
}