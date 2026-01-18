import React from 'react';
import PageHeader from '@/components/shared/PageHeader';
import MetricsOverview from '@/components/admin/MetricsOverview';
import ActivityAuditLog from '@/components/admin/ActivityAuditLog';
import SystemHealthMonitor from '@/components/admin/SystemHealthMonitor';
import QuickActions from '@/components/admin/QuickActions';

export default function AdminDashboard() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Admin Dashboard"
        subtitle="System-Übersicht und Verwaltung"
      />

      <MetricsOverview />

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <SystemHealthMonitor />
        <ActivityAuditLog />
      </div>

      <div className="mt-6">
        <QuickActions />
      </div>
    </div>
  );
}