import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import DashboardCustomizer from './DashboardCustomizer';
import AssignedTasksWidget from './widgets/AssignedTasksWidget';
import PendingApprovalsWidget from './widgets/PendingApprovalsWidget';
import WorkflowStatusWidget from './widgets/WorkflowStatusWidget';
import NotificationsWidget from './widgets/NotificationsWidget';
import QuickStatsWidget from './widgets/QuickStatsWidget';

const WIDGET_COMPONENTS = {
  assigned_tasks: AssignedTasksWidget,
  pending_approvals: PendingApprovalsWidget,
  workflow_status: WorkflowStatusWidget,
  notifications: NotificationsWidget,
  quick_stats: QuickStatsWidget
};

export default function PersonalDashboard() {
  const [showCustomizer, setShowCustomizer] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: preferences = {} } = useQuery({
    queryKey: ['user-preferences', user?.email],
    queryFn: async () => {
      if (!user?.email) return {};
      const result = await base44.asServiceRole.entities.UserPreferences.filter({
        user_email: user.email
      });
      return result[0] || {};
    },
    enabled: !!user?.email
  });

  const enabledWidgets = preferences.dashboard_widgets || [
    'assigned_tasks',
    'pending_approvals',
    'workflow_status',
    'notifications'
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCustomizer(true)}
          className="gap-2"
        >
          <Settings className="w-4 h-4" />
          Anpassen
        </Button>
      </div>

      {showCustomizer && (
        <DashboardCustomizer
          enabledWidgets={enabledWidgets}
          onClose={() => setShowCustomizer(false)}
          onSave={() => setShowCustomizer(false)}
        />
      )}

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {enabledWidgets.map(widgetId => {
          const Component = WIDGET_COMPONENTS[widgetId];
          return Component ? (
            <div key={widgetId}>
              <Component />
            </div>
          ) : null;
        })}
      </div>
    </div>
  );
}