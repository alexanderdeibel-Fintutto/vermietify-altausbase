import React from 'react';
import PageHeader from '@/components/shared/PageHeader';
import QuickStatsWidget from '@/components/dashboard/widgets/QuickStatsWidget';
import BuildingsWidget from '@/components/dashboard/widgets/BuildingsWidget';
import TenantsWidget from '@/components/dashboard/widgets/TenantsWidget';
import ContractsWidget from '@/components/dashboard/widgets/ContractsWidget';
import TasksWidget from '@/components/dashboard/widgets/TasksWidget';
import RevenueWidget from '@/components/widgets/RevenueWidget';

export default function PropertyManagementHub() {
  return (
    <div className="p-6">
      <PageHeader
        title="Immobilien-Management"
        subtitle="Zentrale Verwaltung aller Ihrer Immobilien"
      />

      <QuickStatsWidget />

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        <BuildingsWidget />
        <TenantsWidget />
        <ContractsWidget />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <TasksWidget />
        <RevenueWidget />
      </div>
    </div>
  );
}