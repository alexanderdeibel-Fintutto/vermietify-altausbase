import React from 'react';
import PageHeader from '@/components/shared/PageHeader';
import ScheduledTaskManager from '@/components/automation/ScheduledTaskManager';

export default function ScheduledTasks() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Geplante Aufgaben"
        subtitle="Automatische und wiederkehrende Aufgaben"
      />
      
      <div className="mt-6">
        <ScheduledTaskManager />
      </div>
    </div>
  );
}