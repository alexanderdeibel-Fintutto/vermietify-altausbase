import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Plus, LayoutDashboard } from 'lucide-react';
import { WIDGET_COMPONENTS, AVAILABLE_WIDGETS, getAccessibleWidgets } from '@/components/dashboard/DashboardWidgetLibrary';
import EnhancedWidgetConfig from '@/components/dashboard/EnhancedWidgetConfig';
import { usePackageAccess } from '@/components/hooks/usePackageAccess';
import DeadlineWarningSystem from '@/components/shared/DeadlineWarningSystem';
import OfflineIndicator from '@/components/shared/OfflineIndicator';
import OnboardingChecklist from '@/components/shared/OnboardingChecklist';
import ActionRequiredWidget from '@/components/dashboard/ActionRequiredWidget';
import SubscriptionWidget from '@/components/dashboard/widgets/SubscriptionWidget';
import LimitWarning from '@/components/subscription/LimitWarning';

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
  const [selectedProfile, setSelectedProfile] = useState(null);
  const queryClient = useQueryClient();
  const { hasModuleAccess } = usePackageAccess();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  // Load all user profiles
  const { data: userProfiles = [] } = useQuery({
    queryKey: ['dashboard-profiles', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.DashboardConfig.filter({ 
        user_email: user.email
      });
    },
    enabled: !!user?.email
  });

  // Get accessible widgets
  const accessibleWidgets = getAccessibleWidgets(hasModuleAccess);

  // Load active/default profile
  const savedConfig = userProfiles.find(p => p.is_default) || userProfiles[0];

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

  const switchProfile = (profileId) => {
    const profile = userProfiles.find(p => p.id === profileId);
    if (profile) {
      setSelectedProfile(profileId);
      setLayout(profile.layout);
    }
  };

  const enabledWidgets = layout
    .filter(w => w.enabled)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      {/* Deadline Warnings */}
      <DeadlineWarningSystem />

      {/* Offline Indicator */}
      <OfflineIndicator />

      {/* Limit Warnings */}
      <LimitWarning />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-1">
            Willkommen zurück, {user?.full_name || 'Benutzer'}
          </p>
        </div>
        <div className="flex gap-2">
          {userProfiles.length > 1 && (
            <Select value={selectedProfile || savedConfig?.id} onValueChange={switchProfile}>
              <SelectTrigger className="w-48">
                <LayoutDashboard className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Profil wählen" />
              </SelectTrigger>
              <SelectContent>
                {userProfiles.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.profile_name || 'Standard'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" onClick={() => setConfigOpen(true)}>
            <Settings className="w-4 h-4 mr-2" />
            Anpassen
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Widgets Grid */}
          {enabledWidgets.map((widget) => {
            const WidgetComponent = WIDGET_COMPONENTS[widget.component];
            if (!WidgetComponent) return null;
            
            return (
              <div 
                key={widget.id}
              >
                <WidgetComponent />
              </div>
            );
          })}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <SubscriptionWidget />
          <ActionRequiredWidget />
          <OnboardingChecklist />
        </div>
      </div>

      {/* Old Widgets Grid - to be replaced by the one above*/}
      <div className="space-y-6 hidden">
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
        user={user}
      />
    </div>
  );
}