import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Save } from 'lucide-react';

export default function AutomationWizard({ open, onOpenChange }) {
  const [settings, setSettings] = useState({
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
  const user = base44.auth.me();

  const saveMutation = useMutation({
    mutationFn: async (automationSettings) => {
      // Erstelle oder aktualisiere Automationen
      const automationTypes = {
        stocks_enabled: 'price_updates',
        crypto_enabled: 'price_updates',
        portfolio_changes: 'alerts',
        position_changes: 'alerts',
        tax_optimizations: 'analysis',
        analysis_frequency: 'analysis'
      };

      for (const [key, value] of Object.entries(automationSettings)) {
        if (['stocks_enabled', 'crypto_enabled'].includes(key) && value) {
          await base44.entities.AutomationConfig.create({
            user_id: (await user).id,
            automation_type: 'price_updates',
            is_enabled: true,
            schedule: key === 'stocks_enabled' ? '0 18 * * MON-FRI' : '0 19 * * *',
            configuration: { [key]: value }
          });
        }
      }

      return automationSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automationConfigs'] });
      onOpenChange(false);
    }
  });

  const handleSave = () => {
    saveMutation.mutate(settings);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Automatisierung einrichten</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="price-updates">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="price-updates">Kursupdates</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="analysis">Analysen</TabsTrigger>
          </TabsList>

          {/* Price Updates */}
          <TabsContent value="price-updates" className="space-y-4">
            <p className="text-sm font-light text-slate-600 mb-4">
              Automatische Kursupdates für Ihr Portfolio einrichten
            </p>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Aktien & ETFs</Label>
                  <p className="text-sm text-slate-500 mt-1">Via Yahoo Finance • Werktags 18:00</p>
                </div>
                <Switch
                  checked={settings.stocks_enabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, stocks_enabled: checked })}
                />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Kryptowährungen</Label>
                  <p className="text-sm text-slate-500 mt-1">Via CoinGecko • Täglich 19:00</p>
                </div>
                <Switch
                  checked={settings.crypto_enabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, crypto_enabled: checked })}
                />
              </div>
            </Card>

            <div>
              <Label className="text-sm">Update-Häufigkeit für kritische Positionen (>10%)</Label>
              <Select value={settings.critical_frequency} onValueChange={(value) => setSettings({ ...settings, critical_frequency: value })}>
                <SelectTrigger className="mt-2">
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
          <TabsContent value="alerts" className="space-y-4">
            <p className="text-sm font-light text-slate-600 mb-4">
              Konfigurieren Sie Portfolio-Benachrichtigungen
            </p>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Portfolio-Wert Änderungen</Label>
                  <p className="text-sm text-slate-500 mt-1">Benachrichtigung bei größeren Bewegungen</p>
                </div>
                <Switch
                  checked={settings.portfolio_changes}
                  onCheckedChange={(checked) => setSettings({ ...settings, portfolio_changes: checked })}
                />
              </div>
              {settings.portfolio_changes && (
                <div className="mt-3 flex items-center gap-2">
                  <Label className="text-sm">Schwellwert:</Label>
                  <Input
                    type="number"
                    value={settings.portfolio_threshold}
                    onChange={(e) => setSettings({ ...settings, portfolio_threshold: parseInt(e.target.value) })}
                    className="w-20"
                  />
                  <span className="text-sm">%</span>
                </div>
              )}
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Einzelposition-Alerts</Label>
                  <p className="text-sm text-slate-500 mt-1">Bei starken Bewegungen (±20%)</p>
                </div>
                <Switch
                  checked={settings.position_changes}
                  onCheckedChange={(checked) => setSettings({ ...settings, position_changes: checked })}
                />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Steuer-Optimierungen</Label>
                  <p className="text-sm text-slate-500 mt-1">Hinweise zu Verlustverrechnung</p>
                </div>
                <Switch
                  checked={settings.tax_optimizations}
                  onCheckedChange={(checked) => setSettings({ ...settings, tax_optimizations: checked })}
                />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Dividenden-Termine</Label>
                  <p className="text-sm text-slate-500 mt-1">Erinnerung 2 Tage vor Zahlungen</p>
                </div>
                <Switch
                  checked={settings.dividend_reminders}
                  onCheckedChange={(checked) => setSettings({ ...settings, dividend_reminders: checked })}
                />
              </div>
            </Card>
          </TabsContent>

          {/* Analysis */}
          <TabsContent value="analysis" className="space-y-4">
            <p className="text-sm font-light text-slate-600 mb-4">
              Automatische Portfolio-Analysen
            </p>

            <div>
              <Label className="text-sm">Analysehäufigkeit</Label>
              <Select value={settings.analysis_frequency} onValueChange={(value) => setSettings({ ...settings, analysis_frequency: value })}>
                <SelectTrigger className="mt-2">
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

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending} className="bg-slate-900 hover:bg-slate-800">
            <Save className="h-4 w-4 mr-2" />
            Automatisierung aktivieren
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}