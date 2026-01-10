import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Plus } from 'lucide-react';
import BudgetOverviewWidget from '@/components/dashboard/widgets/BudgetOverviewWidget';
import FinancialForecastWidget from '@/components/dashboard/widgets/FinancialForecastWidget';
import OpenTasksWidget from '@/components/dashboard/widgets/OpenTasksWidget';
import RecentActivitiesWidget from '@/components/dashboard/widgets/RecentActivitiesWidget';
import CriticalNotificationsWidget from '@/components/dashboard/widgets/CriticalNotificationsWidget';
import DocumentAnalysisWidget from '@/components/dashboard/widgets/DocumentAnalysisWidget';
import QuickStatsWidget from '@/components/dashboard/widgets/QuickStatsWidget';
import WidgetConfigDialog from '@/components/dashboard/WidgetConfigDialog';

const DEFAULT_LAYOUT = [
  { id: 'quick-stats', component: 'QuickStatsWidget', size: 'full', order: 0, enabled: true },
  { id: 'budget', component: 'BudgetOverviewWidget', size: 'half', order: 1, enabled: true },
  { id: 'forecast', component: 'FinancialForecastWidget', size: 'half', order: 2, enabled: true },
  { id: 'tasks', component: 'OpenTasksWidget', size: 'half', order: 3, enabled: true },
  { id: 'activities', component: 'RecentActivitiesWidget', size: 'half', order: 4, enabled: true },
  { id: 'notifications', component: 'CriticalNotificationsWidget', size: 'half', order: 5, enabled: true },
  { id: 'documents', component: 'DocumentAnalysisWidget', size: 'half', order: 6, enabled: true }
];

const WIDGET_COMPONENTS = {
  QuickStatsWidget,
  BudgetOverviewWidget,
  FinancialForecastWidget,
  OpenTasksWidget,
  RecentActivitiesWidget,
  CriticalNotificationsWidget,
  DocumentAnalysisWidget
};

export default function Dashboard() {
  const [layout, setLayout] = useState(() => {
    const saved = localStorage.getItem('dashboard-layout');
    return saved ? JSON.parse(saved) : DEFAULT_LAYOUT;
  });
  const [configOpen, setConfigOpen] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const saveLayout = (newLayout) => {
    setLayout(newLayout);
    localStorage.setItem('dashboard-layout', JSON.stringify(newLayout));
  };

  const enabledWidgets = layout
    .filter(w => w.enabled)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-1">
            Willkommen zurück, {user?.full_name || 'Benutzer'}
          </p>
        </div>
        <Button variant="outline" onClick={() => setConfigOpen(true)}>
          <Settings className="w-4 h-4 mr-2" />
          Widgets anpassen
        </Button>
      </div>

      {/* Widgets Grid */}
      <div className="space-y-6">
        {enabledWidgets.map((widget) => {
          const WidgetComponent = WIDGET_COMPONENTS[widget.component];
          if (!WidgetComponent) return null;

          return (
            <div 
              key={widget.id}
              className={
                widget.size === 'full' ? 'w-full' :
                widget.size === 'half' ? 'w-full lg:w-1/2 inline-block align-top lg:pr-3 mb-6' :
                widget.size === 'third' ? 'w-full lg:w-1/3 inline-block align-top lg:pr-3 mb-6' :
                'w-full'
              }
            >
              <WidgetComponent />
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {enabledWidgets.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Plus className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 mb-4">Keine Widgets aktiviert</p>
            <Button onClick={() => setConfigOpen(true)}>
              Widgets hinzufügen
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Config Dialog */}
      <WidgetConfigDialog
        isOpen={configOpen}
        onClose={() => setConfigOpen(false)}
        layout={layout}
        onSave={saveLayout}
      />
    </div>
  );
}