import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Loader2, Save } from 'lucide-react';

export default function AutomationWizard({ open, onOpenChange, userId }) {
  const queryClient = useQueryClient();

  const [settings, setSettings] = useState({
    // Price Updates
    stocks_enabled: true,
    crypto_enabled: true,
    critical_frequency: 'daily',

    // Alerts
    portfolio_changes: true,
    portfolio_threshold: 5,
    position_changes: true,
    position_threshold: 20,
    tax_optimizations: true,
    dividend_reminders: true,

    // Analysis
    analysis_frequency: 'weekly',
    performance_tracking: true,
    diversification_analysis: true
  });

  const saveAutomationMutation = useMutation({
    mutationFn: async () => {
      // Erstelle Automatisierungen basierend auf Settings
      const configs = [];

      if (settings.stocks_enabled) {
        const existing = await base44.entities.AutomationConfig.filter({
          user_id: userId,
          automation_type: 'price_updates'
        });

        if (existing.length === 0) {
          configs.push(
            base44.entities.AutomationConfig.create({
              user_id: userId,
              automation_type: 'price_updates',
              schedule: '0 18 * * MON-FRI',
              is_enabled: true,
              configuration: { assets: 'stocks', frequency: 'daily' }
            })
          );
        }
      }

      if (settings.crypto_enabled) {
        const existing = await base44.entities.AutomationConfig.filter({
          user_id: userId,
          automation_type: 'price_updates'
        });

        if (existing.filter(c => c.configuration.assets === 'crypto').length === 0) {
          configs.push(
            base44.entities.AutomationConfig.create({
              user_id: userId,
              automation_type: 'price_updates',
              schedule: '0 19 * * *',
              is_enabled: true,
              configuration: { assets: 'crypto', frequency: 'daily' }
            })
          );
        }
      }

      if (settings.portfolio_changes || settings.position_changes) {
        configs.push(
          base44.entities.AutomationConfig.create({
            user_id: userId,
            automation_type: 'alerts',
            schedule: '*/30 * * * *',
            is_enabled: true,
            configuration: {
              portfolio_threshold: settings.portfolio_threshold,
              position_threshold: settings.position_threshold,
              dividend_reminders: settings.dividend_reminders
            }
          })
        );
      }

      if (settings.performance_tracking || settings.diversification_analysis) {
        configs.push(
          base44.entities.AutomationConfig.create({
            user_id: userId,
            automation_type: 'analysis',
            schedule: '0 9 * * MON',
            is_enabled: true,
            configuration: {
              analysis_type: settings.analysis_frequency,
              performance: settings.performance_tracking,
              diversification: settings.diversification_analysis
            }
          })
        );
      }

      await Promise.all(configs);

      return { success: true, count: configs.length };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automationConfigs'] });
      onOpenChange(false);
    }
  });

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Automatisierung einrichten</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="price-updates" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="price-updates">Kurse</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="analysis">Analysen</TabsTrigger>
          </TabsList>

          {/* Price Updates */}
          <TabsContent value="price-updates" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <Checkbox 
                  id="stocks"
                  checked={settings.stocks_enabled}
                  onCheckedChange={(checked) => updateSetting('stocks_enabled', checked)}
                />
                <Label htmlFor="stocks" className="flex-1 cursor-pointer">
                  <div>
                    <div className="font-medium">Aktien & ETFs</div>
                    <div className="text-sm text-slate-500">Via Yahoo Finance • Werktags 18:00</div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <Checkbox 
                  id="crypto"
                  checked={settings.crypto_enabled}
                  onCheckedChange={(checked) => updateSetting('crypto_enabled', checked)}
                />
                <Label htmlFor="crypto" className="flex-1 cursor-pointer">
                  <div>
                    <div className="font-medium">Kryptowährungen</div>
                    <div className="text-sm text-slate-500">Via CoinGecko • Täglich 19:00</div>
                  </div>
                </Label>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <Label className="text-sm font-medium mb-2 block">
                  Häufigkeit für kritische Positionen (>10% Portfolio)
                </Label>
                <Select value={settings.critical_frequency} onValueChange={(value) => updateSetting('critical_frequency', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Stündlich (Marktzeiten)</SelectItem>
                    <SelectItem value="daily">Täglich</SelectItem>
                    <SelectItem value="manual">Nur manuell</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          {/* Alerts */}
          <TabsContent value="alerts" className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Portfolio-Wert Änderungen</Label>
                <Switch 
                  checked={settings.portfolio_changes}
                  onCheckedChange={(checked) => updateSetting('portfolio_changes', checked)}
                />
              </div>
              {settings.portfolio_changes && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm">Schwellwert:</span>
                  <Input 
                    type="number" 
                    value={settings.portfolio_threshold}
                    onChange={(e) => updateSetting('portfolio_threshold', parseInt(e.target.value))}
                    className="w-20"
                  />
                  <span className="text-sm">%</span>
                </div>
              )}
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Einzelposition-Alerts</Label>
                <Switch 
                  checked={settings.position_changes}
                  onCheckedChange={(checked) => updateSetting('position_changes', checked)}
                />
              </div>
              {settings.position_changes && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm">Schwellwert:</span>
                  <Input 
                    type="number" 
                    value={settings.position_threshold}
                    onChange={(e) => updateSetting('position_threshold', parseInt(e.target.value))}
                    className="w-20"
                  />
                  <span className="text-sm">%</span>
                </div>
              )}
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Dividenden-Termine</Label>
                <Switch 
                  checked={settings.dividend_reminders}
                  onCheckedChange={(checked) => updateSetting('dividend_reminders', checked)}
                />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Steuer-Optimierungen</Label>
                <Switch 
                  checked={settings.tax_optimizations}
                  onCheckedChange={(checked) => updateSetting('tax_optimizations', checked)}
                />
              </div>
            </Card>
          </TabsContent>

          {/* Analysis */}
          <TabsContent value="analysis" className="space-y-4">
            <Card className="p-4">
              <Label className="text-sm font-medium mb-2 block">Analysehäufigkeit</Label>
              <Select value={settings.analysis_frequency} onValueChange={(value) => updateSetting('analysis_frequency', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Täglich</SelectItem>
                  <SelectItem value="weekly">Wöchentlich</SelectItem>
                  <SelectItem value="monthly">Monatlich</SelectItem>
                </SelectContent>
              </Select>
            </Card>

            <div className="space-y-3">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Performance-Tracking</Label>
                  <Switch 
                    checked={settings.performance_tracking}
                    onCheckedChange={(checked) => updateSetting('performance_tracking', checked)}
                  />
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Diversifikations-Check</Label>
                  <Switch 
                    checked={settings.diversification_analysis}
                    onCheckedChange={(checked) => updateSetting('diversification_analysis', checked)}
                  />
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button 
            onClick={() => saveAutomationMutation.mutate()}
            disabled={saveAutomationMutation.isPending}
            className="bg-slate-900 hover:bg-slate-800"
          >
            {saveAutomationMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Automatisierung aktivieren
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}