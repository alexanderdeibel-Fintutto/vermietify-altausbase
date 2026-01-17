import React from 'react';
import PageHeader from '@/components/shared/PageHeader';
import RuleBasedActions from '@/components/automation/RuleBasedActions';
import ScheduledTaskManager from '@/components/automation/ScheduledTaskManager';
import DeadlineReminders from '@/components/automation/DeadlineReminders';

export default function AutomationCenter() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Automatisierung"
        subtitle="Sparen Sie Zeit mit intelligenten Workflows"
      />

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <RuleBasedActions />
        <ScheduledTaskManager />
      </div>

      <DeadlineReminders />
    </div>
  );
}