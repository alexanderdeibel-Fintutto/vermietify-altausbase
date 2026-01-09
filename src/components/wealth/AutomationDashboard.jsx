import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Clock, Activity, Bell, Settings, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function AutomationDashboard({ user }) {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [automationSettings, setAutomationSettings] = useState({
    stocks_enabled: true,
    crypto_enabled: true,
    critical_frequency: 'daily',
    portfolio_changes: true,
    portfolio_threshold: 5,
    position_changes: true,
    tax_optimizations: true,
    dividend_reminders: true,
    analysis_frequency: 'weekly'
  });
  const queryClient = useQueryClient();

  const { data: automationConfigs = [] } = useQuery({
    queryKey: ['automationConfigs', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await base44.entities.AutomationConfig.filter(
        { user_id: user.id },
        '-created_date'
      ) || [];
    },
    enabled: !!user?.id
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['portfolioAlerts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await base44.entities.PortfolioAlert.filter(
        { user_id: user.id, is_read: false },
        '-triggered_at',
        50
      ) || [];
    },
    enabled: !!user?.id,
    refetchInterval: 5 * 60 * 1000 // 5 minutes
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

  const saveAutomationMutation = useMutation({
    mutationFn: async () => {
      return await base44.entities.AutomationConfig.create({
        user_id: user.id,
        automation_type: 'price_updates',
        is_enabled: true,
        schedule: '0 18 * * MON-FRI',
        configuration: automationSettings
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automationConfigs'] });
      setWizardOpen(false);
    }
  });

  const activeCount = automationConfigs.filter(c => c.is_enabled).length;
  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;

  const formatRelativeTime = (date) => {
    if (!date) return 'nie';
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `vor ${diffMins}m`;
    if (diffHours < 24) return `vor ${diffHours}h`;
    return `vor ${diffDays}d`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-light text-slate-900">Automatisierung</h1>
        <Button onClick={() => setWizardOpen(true)} className="bg-slate-900 hover:bg-slate-800">
          <Settings className="h-4 w-4 mr-2" />
          Konfigurieren
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-light text-slate-600">Auto-Updates aktiv</div>
            <div className="text-2xl font-light text-slate-900 mt-2">{activeCount}</div>
            <div className="text-xs text-slate-500 mt-1">von {automationConfigs.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-light text-slate-600">Letzte Aktualisierung</div>
            <div className="text-lg font-light text-slate-900 mt-2">
              {automationConfigs.length > 0 
                ? formatRelativeTime(automationConfigs[0]?.last_run)
                : 'nie'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-light text-slate-600">API-Calls heute</div>
            <div className="text-2xl font-light text-slate-900 mt-2">24 / 500</div>
            <div className="text-xs text-slate-500 mt-1">von Limit</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-light text-slate-600">Offene Alerts</div>
            <div className="text-2xl font-light text-slate-900 mt-2">{alerts.length}</div>
            <div className={`text-xs mt-1 ${criticalAlerts > 0 ? 'text-red-600' : 'text-slate-500'}`}>
              {criticalAlerts > 0 ? `${criticalAlerts} kritisch` : 'Keine kritischen'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Automation Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-light">Automatisierungs-Einstellungen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {automationConfigs.length === 0 ? (
            <p className="text-sm text-slate-600 font-light">Noch keine Automatisierung konfiguriert.</p>
          ) : (
            automationConfigs.map(config => (
              <div
                key={config.id}
                className="flex items-center justify-between p-4 border border-slate-200 rounded-lg"
              >
                <div className="flex items-center space-x-3 flex-1">
                  <Switch
                    checked={config.is_enabled}
                    onCheckedChange={() => toggleAutomationMutation.mutate(config.id)}
                  />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium">
                      {config.automation_type === 'price_updates' && 'Automatische Kursupdates'}
                      {config.automation_type === 'alerts' && 'Portfolio-Alerts'}
                      {config.automation_type === 'analysis' && 'Portfolio-Analyse'}
                      {config.automation_type === 'tax_calc' && 'Steuerberechnung'}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      {config.schedule} • {config.run_count} Läufe
                    </p>
                  </div>
                </div>
                {config.last_run && (
                  <span className="text-xs text-slate-500">
                    vor {formatRelativeTime(config.last_run)}
                  </span>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Portfolio Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-light">Portfolio-Alerts ({alerts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <p className="text-sm text-slate-600 font-light">Keine neuen Alerts</p>
          ) : (
            <div className="space-y-3">
              {alerts.slice(0, 5).map(alert => (
                <Alert key={alert.id} variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
                  {alert.severity === 'critical' && <AlertTriangle className="h-4 w-4" />}
                  {alert.severity !== 'critical' && <AlertCircle className="h-4 w-4" />}
                  <AlertTitle>{alert.title}</AlertTitle>
                  <AlertDescription className="text-xs mt-1">
                    {alert.message}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Automation Wizard */}
      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Automatisierung einrichten</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="price-updates" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="price-updates">Kurse</TabsTrigger>
              <TabsTrigger value="alerts">Alerts</TabsTrigger>
              <TabsTrigger value="analysis">Analyse</TabsTrigger>
            </TabsList>

            {/* Price Updates */}
            <TabsContent value="price-updates" className="space-y-4 py-4">
              <p className="text-sm text-slate-600">Wählen Sie welche Positionen aktualisiert werden sollen:</p>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-4 border rounded-lg">
                  <Checkbox
                    id="stocks"
                    checked={automationSettings.stocks_enabled}
                    onCheckedChange={(checked) =>
                      setAutomationSettings(prev => ({ ...prev, stocks_enabled: checked }))
                    }
                  />
                  <Label htmlFor="stocks" className="flex-1 cursor-pointer">
                    <div className="font-medium text-sm">Aktien & ETFs</div>
                    <div className="text-xs text-slate-500">Via Yahoo Finance • Werktags 18:00</div>
                  </Label>
                </div>

                <div className="flex items-center space-x-3 p-4 border rounded-lg">
                  <Checkbox
                    id="crypto"
                    checked={automationSettings.crypto_enabled}
                    onCheckedChange={(checked) =>
                      setAutomationSettings(prev => ({ ...prev, crypto_enabled: checked }))
                    }
                  />
                  <Label htmlFor="crypto" className="flex-1 cursor-pointer">
                    <div className="font-medium text-sm">Kryptowährungen</div>
                    <div className="text-xs text-slate-500">Via CoinGecko • Täglich 19:00</div>
                  </Label>
                </div>
              </div>

              <div>
                <Label className="text-sm font-light">Update-Häufigkeit für kritische Positionen</Label>
                <Select
                  value={automationSettings.critical_frequency}
                  onValueChange={(value) =>
                    setAutomationSettings(prev => ({ ...prev, critical_frequency: value }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Stündlich (Marktzeiten)</SelectItem>
                    <SelectItem value="daily">Täglich</SelectItem>
                    <SelectItem value="manual">Nur manuell</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            {/* Alerts */}
            <TabsContent value="alerts" className="space-y-4 py-4">
              <p className="text-sm text-slate-600">Konfigurieren Sie Benachrichtigungen:</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-sm font-medium">Portfolio-Änderungen</Label>
                    <p className="text-xs text-slate-500 mt-1">Bei großen Bewegungen benachrichtigen</p>
                  </div>
                  <Switch
                    checked={automationSettings.portfolio_changes}
                    onCheckedChange={(checked) =>
                      setAutomationSettings(prev => ({ ...prev, portfolio_changes: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-sm font-medium">Steuer-Optimierungen</Label>
                    <p className="text-xs text-slate-500 mt-1">Tipps zur Steuerersparnis</p>
                  </div>
                  <Switch
                    checked={automationSettings.tax_optimizations}
                    onCheckedChange={(checked) =>
                      setAutomationSettings(prev => ({ ...prev, tax_optimizations: checked }))
                    }
                  />
                </div>
              </div>
            </TabsContent>

            {/* Analysis */}
            <TabsContent value="analysis" className="space-y-4 py-4">
              <div>
                <Label className="text-sm font-light">Analysehäufigkeit</Label>
                <Select
                  value={automationSettings.analysis_frequency}
                  onValueChange={(value) =>
                    setAutomationSettings(prev => ({ ...prev, analysis_frequency: value }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Täglich</SelectItem>
                    <SelectItem value="weekly">Wöchentlich</SelectItem>
                    <SelectItem value="monthly">Monatlich</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setWizardOpen(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={() => saveAutomationMutation.mutate()}
              disabled={saveAutomationMutation.isPending}
              className="bg-slate-900 hover:bg-slate-800"
            >
              Aktivieren
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}