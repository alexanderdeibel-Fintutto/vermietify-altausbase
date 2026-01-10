import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Plus } from 'lucide-react';
import { WIDGET_COMPONENTS, AVAILABLE_WIDGETS } from '@/components/dashboard/DashboardWidgetLibrary';
import EnhancedWidgetConfig from '@/components/dashboard/EnhancedWidgetConfig';

const DEFAULT_LAYOUT = AVAILABLE_WIDGETS.slice(0, 7).map((widget, idx) => ({
  id: widget.id,
  component: widget.component,
  size: widget.defaultSize,
  order: idx,
  enabled: true
}));

export default function Dashboard() {
  const [layout, setLayout] = useState(DEFAULT_LAYOUT);
  const [configOpen, setConfigOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  // Load user-specific dashboard config
  const { data: savedConfig } = useQuery({
    queryKey: ['dashboard-config', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const configs = await base44.entities.DashboardConfig.filter({ 
        user_email: user.email,
        is_default: true 
      });
      return configs[0] || null;
    },
    enabled: !!user?.email
  });

  // Save dashboard config
  const saveConfigMutation = useMutation({
    mutationFn: async (newLayout) => {
      if (!user?.email) return;
      
      if (savedConfig?.id) {
        return await base44.entities.DashboardConfig.update(savedConfig.id, {
          layout: newLayout
        });
      } else {
        return await base44.asServiceRole.entities.DashboardConfig.create({
          user_email: user.email,
          layout: newLayout,
          is_default: true
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['dashboard-config']);
    }
  });

  // Load saved layout or fallback to localStorage
  useEffect(() => {
    if (savedConfig?.layout) {
      setLayout(savedConfig.layout);
    } else {
      const saved = localStorage.getItem('dashboard-layout');
      if (saved) {
        setLayout(JSON.parse(saved));
      }
    }
  }, [savedConfig]);

  const saveLayout = (newLayout) => {
    setLayout(newLayout);
    localStorage.setItem('dashboard-layout', JSON.stringify(newLayout));
    saveConfigMutation.mutate(newLayout);
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
      <EnhancedWidgetConfig
        isOpen={configOpen}
        onClose={() => setConfigOpen(false)}
        layout={layout}
        onSave={saveLayout}
      />
    </div>
  );
}