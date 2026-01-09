import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  RefreshCw, Clock, Activity, Bell, Play, Settings, AlertTriangle, 
  CheckCircle2, AlertCircle, Download, Lightbulb 
} from 'lucide-react';
import { formatRelativeTime } from '@/utils';

export default function AutomationDashboard({ userId }) {
  const queryClient = useQueryClient();

  const { data: automationConfigs = [] } = useQuery({
    queryKey: ['automationConfigs', userId],
    queryFn: async () => {
      const results = await base44.entities.AutomationConfig.filter({
        user_id: userId
      });
      return results || [];
    }
  });

  const { data: portfolioAlerts = [] } = useQuery({
    queryKey: ['portfolioAlerts', userId],
    queryFn: async () => {
      const results = await base44.entities.PortfolioAlert.filter({
        user_id: userId,
        is_resolved: false
      });
      return results || [];
    },
    refetchInterval: 30000
  });

  const toggleAutomationMutation = useMutation({
    mutationFn: async (configId) => {
      const config = automationConfigs.find(c => c.id === configId);
      return await base44.entities.AutomationConfig.update(configId, {
        is_enabled: !config.is_enabled
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automationConfigs'] });
    }
  });

  const markAlertReadMutation = useMutation({
    mutationFn: async (alertId) => {
      return await base44.entities.PortfolioAlert.update(alertId, {
        is_read: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolioAlerts'] });
    }
  });

  const activeAutomations = automationConfigs.filter(c => c.is_enabled).length;
  const criticalAlerts = portfolioAlerts.filter(a => a.severity === 'critical').length;

  const getAutomationTitle = (type) => {
    const titles = {
      price_updates: 'Automatische Kursupdates',
      alerts: 'Portfolio-Benachrichtigungen',
      analysis: 'Portfolio-Analysen',
      tax_calc: 'Steuerberechnung'
    };
    return titles[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw className="h-4 w-4 text-slate-400" />
              <p className="text-xs text-slate-600">Automatisierungen aktiv</p>
            </div>
            <p className="text-3xl font-bold">{activeAutomations}/{automationConfigs.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-slate-400" />
              <p className="text-xs text-slate-600">Letzte Aktualisierung</p>
            </div>
            {automationConfigs.length > 0 && automationConfigs[0].last_run ? (
              <p className="text-lg font-medium">{formatRelativeTime(automationConfigs[0].last_run)}</p>
            ) : (
              <p className="text-lg font-medium">—</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-slate-400" />
              <p className="text-xs text-slate-600">Läufe heute</p>
            </div>
            <p className="text-3xl font-bold">
              {automationConfigs.reduce((sum, c) => sum + (c.run_count || 0), 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="h-4 w-4 text-orange-400" />
              <p className="text-xs text-slate-600">Offene Alerts</p>
            </div>
            <p className="text-3xl font-bold">
              {portfolioAlerts.length}
              {criticalAlerts > 0 && <span className="text-sm text-red-600 ml-2">({criticalAlerts} kritisch)</span>}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Automation Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Automatisierung-Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {automationConfigs.length === 0 ? (
            <p className="text-sm text-slate-600 font-light">Keine Automatisierungen konfiguriert</p>
          ) : (
            automationConfigs.map(config => (
              <div key={config.id} className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                <div className="flex items-center gap-4 flex-1">
                  <Switch 
                    checked={config.is_enabled}
                    onCheckedChange={() => toggleAutomationMutation.mutate(config.id)}
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900">{getAutomationTitle(config.automation_type)}</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      {config.schedule} • {config.run_count || 0} Läufe
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {config.error_count > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {config.error_count} Fehler
                    </Badge>
                  )}
                  {config.last_run && (
                    <span className="text-xs text-slate-500">
                      vor {formatRelativeTime(config.last_run)}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Portfolio Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio-Alerts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {portfolioAlerts.length === 0 ? (
            <p className="text-sm text-slate-600 font-light">Keine aktiven Alerts</p>
          ) : (
            portfolioAlerts.map(alert => (
              <Alert 
                key={alert.id} 
                className={
                  alert.severity === 'critical' 
                    ? 'border-red-200 bg-red-50' 
                    : alert.severity === 'warning'
                    ? 'border-orange-200 bg-orange-50'
                    : 'border-blue-200 bg-blue-50'
                }
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {alert.severity === 'critical' && <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />}
                    {alert.severity === 'warning' && <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />}
                    {alert.severity === 'info' && <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5" />}
                    <AlertTitle className="ml-2">{alert.title}</AlertTitle>
                    <AlertDescription className="ml-6 mt-1 text-sm">
                      {alert.message}
                    </AlertDescription>
                  </div>
                  <span className="text-xs text-slate-500 ml-2">
                    {formatRelativeTime(alert.triggered_at)}
                  </span>
                </div>

                <div className="flex gap-2 mt-3 ml-6">
                  {!alert.is_read && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => markAlertReadMutation.mutate(alert.id)}
                      className="text-xs"
                    >
                      Als gelesen markieren
                    </Button>
                  )}
                </div>
              </Alert>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}