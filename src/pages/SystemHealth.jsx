import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import SystemHealthMonitor from '@/components/admin/SystemHealthMonitor';
import PerformanceMetrics from '@/components/analytics/PerformanceMetrics';
import ErrorTracker from '@/components/analytics/ErrorTracker';

export default function SystemHealth() {
  const { data: health } = useQuery({
    queryKey: ['system-health'],
    queryFn: () => base44.functions.invoke('checkSystemHealth', {}),
    refetchInterval: 60000 // Refresh every minute
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="System-Gesundheit"
        subtitle="Überwachen Sie die System-Performance"
      />

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <SystemHealthMonitor />
        <PerformanceMetrics />
      </div>

      <ErrorTracker />
    </div>
  );
}