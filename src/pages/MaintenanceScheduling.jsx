import React from 'react';
import { Card } from '@/components/ui/card';
import MaintenanceCalendarView from '@/components/maintenance/MaintenanceCalendarView';
import RoleBasedGuard from '@/components/admin/RoleBasedGuard';

export default function MaintenanceScheduling() {
  return (
    <RoleBasedGuard requiredRole="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Wartungsplanung</h1>
          <p className="text-slate-600">Terminkalender für alle Wartungsaufgaben</p>
        </div>

        <MaintenanceCalendarView />
      </div>
    </RoleBasedGuard>
  );
}