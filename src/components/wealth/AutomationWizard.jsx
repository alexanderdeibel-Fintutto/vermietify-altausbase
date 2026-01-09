import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Save } from 'lucide-react';

export default function AutomationWizard({ open, onOpenChange, userId }) {
  const queryClient = useQueryClient();
  
  const [settings, setSettings] = useState({
    stocks_enabled: true,
    crypto_enabled: true,
    metals_enabled: false,
    critical_frequency: 'daily',
    portfolio_changes: true,
    portfolio_threshold: 5,
    position_changes: true,
    tax_optimizations: true,
    dividend_reminders: true,
    analysis_frequency: 'weekly',
    performance_tracking: true,
    diversification_analysis: true
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const automations = [];
      
      // Price Updates
      if (settings.stocks_enabled) {
        automations.push({
          user_id: userId,
          automation_type: 'price_updates',
          schedule: '0 18 * * MON-FRI',
          is_enabled: true,
          configuration: { asset_types: ['stocks', 'etfs', 'funds'] }
        });
      }
      
      if (settings.crypto_enabled) {
        automations.push({
          user_id: userId,
          automation_type: 'price_updates',
          schedule: '0 19 * * *',
          is_enabled: true,
          configuration: { asset_types: ['crypto'] }
        });
      }
      
      // Alerts
      automations.push({
        user_id: userId,
        automation_type: 'alerts',
        schedule: '*/30 * * * *',
        is_enabled: settings.portfolio_changes,
        configuration: { 
          portfolio_threshold: settings.portfolio_threshold,
          position_alerts: settings.position_changes,
          tax_alerts: settings.tax_optimizations,
          dividend_reminders: settings.dividend_reminders
        }
      });
      
      // Analysis
      automations.push({
        user_id: userId,
        automation_type: 'analysis',
        schedule: '0 9 * * MON',
        is_enabled: true,
        configuration: { 
          performance: settings.performance_tracking,
          diversification: settings.diversification_analysis
        }
      });
      
      // Create/update automations
      for (const automation of automations) {
        await base44.entities.AutomationConfig.create(automation);
      }
      
      return { success: true, automations_created: automations.length };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automationConfigs'] });
      onOpenChange(false);
    }
  });

  const handleSave = async () => {
    await saveMutation.mutateAsync();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Automatisierung einrichten</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="price-updates" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="price-updates">Kursupdates</TabsTrigger>
            <TabsTrigger value="alerts">Benachrichtigungen</TabsTrigger>
            <TabsTrigger value="analysis">Analysen</TabsTrigger>
          </TabsList>

          <TabsContent value="price-updates" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">Automatische Kursupdates</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Wählen Sie welche Vermögensklassen automatisch aktualisiert werden sollen.
                </p>
              </div>

              <Card className="p-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="stocks"
                    checked={settings.stocks_enabled}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, stocks_enabled: checked })
                    }
                  />
                  <Label htmlFor="stocks" className="flex-1 cursor-pointer">
                    <div className="font-medium">Aktien & ETFs</div>
                    <div className="text-xs text-slate-500">
                      Yahoo Finance • Werktags 18:00 MEZ
                    </div>
                  </Label>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="crypto"
                    checked={settings.crypto_enabled}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, crypto_enabled: checked })
                    }
                  />
                  <Label htmlFor="crypto" className="flex-1 cursor-pointer">
                    <div className="font-medium">Kryptowährungen</div>
                    <div className="text-xs text-slate-500">
                      CoinGecko • Täglich 19:00 MEZ
                    </div>
                  </Label>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="metals"
                    checked={settings.metals_enabled}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, metals_enabled: checked })
                    }
                  />
                  <Label htmlFor="metals" className="flex-1 cursor-pointer">
                    <div className="font-medium">Edelmetalle</div>
                    <div className="text-xs text-slate-500">
                      Bundesbank API • Täglich
                    </div>
                  </Label>
                </div>
              </Card>

              <div>
                <Label className="text-sm">Update-Frequenz für kritische Positionen (>10% Portfolio)</Label>
                <Select value={settings.critical_frequency} onValueChange={(value) =>
                  setSettings({ ...settings, critical_frequency: value })
                }>
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
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Portfolio-Benachrichtigungen</h3>

              <Card className="p-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="portfolio-changes"
                    checked={settings.portfolio_changes}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, portfolio_changes: checked })
                    }
                  />
                  <div className="flex-1">
                    <Label htmlFor="portfolio-changes" className="cursor-pointer font-medium">
                      Portfolio-Wert Änderungen
                    </Label>
                    <p className="text-xs text-slate-500 mt-1">
                      Benachrichtigung bei größeren Bewegungen
                    </p>
                    {settings.portfolio_changes && (
                      <div className="mt-3 flex items-center space-x-2">
                        <span className="text-sm">Schwellwert:</span>
                        <input
                          type="number"
                          value={settings.portfolio_threshold}
                          onChange={(e) =>
                            setSettings({ ...settings, portfolio_threshold: Number(e.target.value) })
                          }
                          className="w-16 px-2 py-1 border rounded"
                        />
                        <span className="text-sm">%</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="position-changes"
                    checked={settings.position_changes}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, position_changes: checked })
                    }
                  />
                  <div className="flex-1">
                    <Label htmlFor="position-changes" className="cursor-pointer font-medium">
                      Einzelposition-Alerts
                    </Label>
                    <p className="text-xs text-slate-500 mt-1">
                      Bei ±20% Bewegungen einzelner Wertpapiere
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="tax-alerts"
                    checked={settings.tax_optimizations}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, tax_optimizations: checked })
                    }
                  />
                  <div className="flex-1">
                    <Label htmlFor="tax-alerts" className="cursor-pointer font-medium">
                      Steuer-Optimierungen
                    </Label>
                    <p className="text-xs text-slate-500 mt-1">
                      Hinweise zu Verlustverrechnung zum Jahresende
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="dividend-reminders"
                    checked={settings.dividend_reminders}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, dividend_reminders: checked })
                    }
                  />
                  <div className="flex-1">
                    <Label htmlFor="dividend-reminders" className="cursor-pointer font-medium">
                      Dividenden-Termine
                    </Label>
                    <p className="text-xs text-slate-500 mt-1">
                      Erinnerung 2 Tage vor Zahlungen
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Portfolio-Analysen</h3>

              <div>
                <Label className="text-sm font-medium">Analysehäufigkeit</Label>
                <Select value={settings.analysis_frequency} onValueChange={(value) =>
                  setSettings({ ...settings, analysis_frequency: value })
                }>
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

              <Card className="p-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="performance"
                    checked={settings.performance_tracking}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, performance_tracking: checked })
                    }
                  />
                  <Label htmlFor="performance" className="cursor-pointer font-medium">
                    Performance-Tracking
                  </Label>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="diversification"
                    checked={settings.diversification_analysis}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, diversification_analysis: checked })
                    }
                  />
                  <Label htmlFor="diversification" className="cursor-pointer font-medium">
                    Diversifikations-Check
                  </Label>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending} className="gap-2">
            <Save className="w-4 h-4" />
            {saveMutation.isPending ? 'Wird gespeichert...' : 'Automatisierung aktivieren'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}