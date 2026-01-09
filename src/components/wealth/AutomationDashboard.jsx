import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { RefreshCw, Clock, Activity, Bell, AlertTriangle, CheckCircle2, Play, Download } from 'lucide-react';
import AutomationWizard from './AutomationWizard';

export default function AutomationDashboard({ portfolio = [] }) {
  const [wizardOpen, setWizardOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: automationConfigs = [] } = useQuery({
    queryKey: ['automationConfigs'],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (!user) return [];
      const results = await base44.entities.AutomationConfig.filter({ user_id: user.id });
      return results || [];
    }
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['portfolioAlerts'],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (!user) return [];
      const results = await base44.entities.PortfolioAlert.filter(
        { user_id: user.id, is_resolved: false },
        '-triggered_at',
        50
      );
      return results || [];
    },
    refetchInterval: 5 * 60 * 1000
  });

  const toggleAutomationMutation = useMutation({
    mutationFn: async (configId) => {
      const config = automationConfigs.find(c => c.id === configId);
      await base44.entities.AutomationConfig.update(configId, {
        is_enabled: !config.is_enabled
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automationConfigs'] });
    }
  });

  const markAlertReadMutation = useMutation({
    mutationFn: (alertId) => base44.entities.PortfolioAlert.update(alertId, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolioAlerts'] });
    }
  });

  const runNowMutation = useMutation({
    mutationFn: async (functionName) => {
      return await base44.functions.invoke(functionName, {});
    }
  });

  const stats = {
    activeUpdates: automationConfigs.filter(c => c.is_enabled).length,
    totalConfigs: automationConfigs.length,
    openAlerts: alerts.filter(a => !a.is_read).length,
    criticalAlerts: alerts.filter(a => a.severity === 'critical' && !a.is_read).length
  };

  const getAutomationTitle = (type) => {
    const titles = {
      price_updates: 'Automatische Kursupdates',
      alerts: 'Portfolio-Benachrichtigungen',
      analysis: 'Portfolio-Analysen',
      tax_calc: 'Steuerberechnung'
    };
    return titles[type] || type;
  };

  const getAutomationSchedule = (type) => {
    const schedules = {
      price_updates: 'Werktags 18:00 MEZ',
      alerts: 'Alle 30 Minuten',
      analysis: 'Montags 09:00 MEZ',
      tax_calc: '1. des Monats 10:00 MEZ'
    };
    return schedules[type] || 'Benutzerdefiniert';
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-light text-slate-600">Automatisierung aktiv</div>
            <div className="text-2xl font-light text-slate-900 mt-2">
              {stats.activeUpdates}/{stats.totalConfigs}
            </div>
            <div className="text-xs text-slate-500 mt-1">Konfigurationen</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-light text-slate-600">Letzte Updates</div>
            <div className="text-2xl font-light text-green-600 mt-2">
              {portfolio.filter(p => {
                const lastUpdate = new Date(p.last_price_update);
                const today = new Date();
                return lastUpdate.toDateString() === today.toDateString();
              }).length}
            </div>
            <div className="text-xs text-slate-500 mt-1">heute aktualisiert</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-light text-slate-600">Offene Alerts</div>
            <div className={`text-2xl font-light ${stats.openAlerts > 0 ? 'text-orange-600' : 'text-slate-900'} mt-2`}>
              {stats.openAlerts}
            </div>
            <div className={`text-xs ${stats.criticalAlerts > 0 ? 'text-red-600' : 'text-slate-500'} mt-1`}>
              {stats.criticalAlerts} kritisch
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-light text-slate-600">Portfolio-Wert</div>
            <div className="text-2xl font-light text-slate-900 mt-2">
              {(portfolio.reduce((sum, a) => sum + (a.quantity * a.current_value), 0) / 1000).toFixed(0)}k€
            </div>
            <div className="text-xs text-slate-500 mt-1">Gesamt</div>
          </CardContent>
        </Card>
      </div>

      {/* Automation Settings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Automatisierung-Einstellungen</CardTitle>
          <Button onClick={() => setWizardOpen(true)} className="bg-slate-900 hover:bg-slate-800">
            Konfigurieren
          </Button>
        </CardHeader>
        <CardContent>
          {automationConfigs.length === 0 ? (
            <p className="text-sm font-light text-slate-600">Noch keine Automatisierung aktiv</p>
          ) : (
            <div className="space-y-3">
              {automationConfigs.map(config => (
                <div key={config.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-center gap-4 flex-1">
                    <Switch
                      checked={config.is_enabled}
                      onCheckedChange={() => toggleAutomationMutation.mutate(config.id)}
                    />
                    <div>
                      <h4 className="text-sm font-medium text-slate-900">{getAutomationTitle(config.automation_type)}</h4>
                      <p className="text-xs text-slate-500 mt-1">{getAutomationSchedule(config.automation_type)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{config.run_count} Läufe</Badge>
                    {config.last_run && (
                      <span className="text-xs text-slate-500">
                        vor {Math.floor((Date.now() - new Date(config.last_run)) / 60000)}m
                      </span>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => runNowMutation.mutate(config.automation_type)}
                      disabled={runNowMutation.isPending}
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Portfolio-Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map(alert => (
                <Alert key={alert.id} className={alert.severity === 'critical' ? 'border-red-300 bg-red-50' : ''}>
                  {alert.severity === 'critical' && <AlertTriangle className="h-4 w-4 text-red-600" />}
                  {alert.severity === 'warning' && <AlertTriangle className="h-4 w-4 text-orange-600" />}
                  {alert.severity === 'info' && <Bell className="h-4 w-4 text-blue-600" />}
                  <AlertTitle className="flex justify-between">
                    <span>{alert.title}</span>
                    <span className="text-xs font-light text-slate-500">
                      vor {Math.floor((Date.now() - new Date(alert.triggered_at)) / 60000)}m
                    </span>
                  </AlertTitle>
                  <AlertDescription className="mt-2">
                    <p className="text-sm font-light">{alert.message}</p>
                    <div className="flex justify-end mt-2 gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => markAlertReadMutation.mutate(alert.id)}
                      >
                        Als gelesen markieren
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <AutomationWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </div>
  );
}