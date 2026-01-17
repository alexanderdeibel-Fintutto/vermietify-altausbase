import React from 'react';
import PageHeader from '@/components/shared/PageHeader';
import SystemHealthMonitor from '@/components/admin/SystemHealthMonitor';
import PerformanceMetrics from '@/components/analytics/PerformanceMetrics';
import BackupRestore from '@/components/backup/BackupRestore';

export default function SystemHealth() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="System-Status"
        subtitle="Überwachen Sie die Systemleistung"
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <SystemHealthMonitor />
        <PerformanceMetrics />
      </div>

      <div className="mt-6">
        <BackupRestore />
      </div>
    </div>
  );
}