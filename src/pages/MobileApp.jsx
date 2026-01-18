import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import QuickStatsWidget from '@/components/dashboard/widgets/QuickStatsWidget';
import TasksWidget from '@/components/dashboard/widgets/TasksWidget';
import NotificationsWidget from '@/components/dashboard/widgets/NotificationsWidget';
import QuickActionsMenu from '@/components/dashboard/QuickActionsMenu';

export default function MobileApp() {
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  return (
    <div className="min-h-screen bg-[var(--theme-background)] pb-20">
      <div className="bg-gradient-to-r from-[var(--vf-primary-600)] to-[var(--vf-accent-500)] text-white p-6 pb-8">
        <h1 className="text-2xl font-bold">Hallo, {user?.full_name?.split(' ')[0]}! 👋</h1>
        <p className="text-sm opacity-90 mt-1">
          {new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        <QuickStatsWidget />
        <QuickActionsMenu />
        <TasksWidget />
        <NotificationsWidget />
      </div>
    </div>
  );
}