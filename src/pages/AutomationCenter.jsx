import React from 'react';
import PageHeader from '@/components/shared/PageHeader';
import RuleBasedActions from '@/components/automation/RuleBasedActions';
import DeadlineReminders from '@/components/automation/DeadlineReminders';
import ScheduledTaskManager from '@/components/automation/ScheduledTaskManager';

export default function AutomationCenter() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Automatisierungs-Zentrale"
        subtitle="Automatisieren Sie wiederkehrende Aufgaben"
      />

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <RuleBasedActions />
        <DeadlineReminders />
      </div>

      <ScheduledTaskManager />
    </div>
  );
}