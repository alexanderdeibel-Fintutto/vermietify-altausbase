import React from 'react';
import QuickStatsWidget from './widgets/QuickStatsWidget';
import BuildingsWidget from './widgets/BuildingsWidget';
import TasksWidget from './widgets/TasksWidget';
import NotificationsWidget from './widgets/NotificationsWidget';
import UpcomingTasksWidget from './widgets/UpcomingTasksWidget';
import RevenueWidget from '@/components/widgets/RevenueWidget';

export default function CustomizableDashboard() {
  return (
    <div className="space-y-6">
      <QuickStatsWidget />

      <div className="grid lg:grid-cols-3 gap-6">
        <BuildingsWidget />
        <TasksWidget />
        <NotificationsWidget />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <RevenueWidget />
        <UpcomingTasksWidget />
      </div>
    </div>
  );
}