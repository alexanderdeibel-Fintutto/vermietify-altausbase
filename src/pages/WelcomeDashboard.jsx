import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import CustomizableDashboard from '@/components/dashboard/CustomizableDashboard';
import DashboardBookmarks from '@/components/dashboard/DashboardBookmarks';
import QuickActionsMenu from '@/components/dashboard/QuickActionsMenu';
import ActivityFeed from '@/components/shared/ActivityFeed';

export default function WelcomeDashboard() {
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          Willkommen zurück, {user?.full_name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-[var(--theme-text-secondary)] mt-1">
          {new Date().toLocaleDateString('de-DE', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          })}
        </p>
      </div>

      <QuickActionsMenu />

      <div className="mt-6">
        <CustomizableDashboard />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <DashboardBookmarks />
        <ActivityFeed />
      </div>
    </div>
  );
}