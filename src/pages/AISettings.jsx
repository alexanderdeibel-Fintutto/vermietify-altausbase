import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import AIBudgetOverview from '../components/ai/AIBudgetOverview';
import { Bot, Save, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AISettings() {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(null);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiStatus, setApiStatus] = useState('unknown');
  const [testingApi, setTestingApi] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      if (currentUser?.role !== 'admin') {
        toast.error('Zugriff verweigert. Nur Administratoren können AI-Einstellungen ändern.');
        return;
      }

      const settingsList = await base44.entities.AISettings.list();
      const currentSettings = settingsList?.[0];
      
      if (!currentSettings) {
        const newSettings = await base44.entities.AISettings.create({
          provider: 'anthropic',
          default_model: 'claude-sonnet-4-20250514',
          is_enabled: true,
          monthly_budget_eur: 50,
          budget_warning_threshold: 80,
          enable_prompt_caching: true,
          enable_batch_processing: false,
          rate_limit_per_user_hour: 20,
          rate_limit_per_user_day: 100,
          allowed_features: ['chat', 'ocr', 'analysis', 'categorization'],
          api_status: 'unknown'
        });
        setSettings(newSettings);
      } else {
        setSettings(currentSettings);
        setApiStatus(currentSettings.api_status || 'unknown');
      }

      const featuresList = await base44.entities.AIFeatureConfig.list();
      setFeatures(featuresList || []);
    } catch (e) {
      console.error('Failed to load AI settings:', e);
      toast.error('Fehler beim Laden der Einstellungen');
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    setSaving(true);
    try {
      await base44.entities.AISettings.update(settings.id, settings);
      
      for (const feature of features) {
        await base44.entities.AIFeatureConfig.update(feature.id, feature);
      }
      
      toast.success('Einstellungen gespeichert');
    } catch (e) {
      console.error('Failed to save settings:', e);
      toast.error('Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  }

  async function testAPIConnection() {
    setTestingApi(true);
    try {
      const response = await base44.functions.invoke('aiCoreService', {
        action: 'chat',
        prompt: 'Hallo, teste API-Verbindung',
        userId: user.email,
        featureKey: 'chat',
        maxTokens: 10
      });

      if (response.data.success) {
        setApiStatus('active');
        setSettings({ ...settings, api_status: 'active', last_api_check: new Date().toISOString() });
        await base44.entities.AISettings.update(settings.id, { 
          api_status: 'active', 
          last_api_check: new Date().toISOString() 
        });
        toast.success('API-Verbindung erfolgreich');
      } else {
        setApiStatus('error');
        toast.error('API-Verbindung fehlgeschlagen');
      }
    } catch (e) {
      setApiStatus('error');
      toast.error('API-Verbindung fehlgeschlagen: ' + e.message);
    } finally {
      setTestingApi(false);
    }
  }

  function updateFeature(featureId, updates) {
    setFeatures(features.map(f => 
      f.id === featureId ? { ...f, ...updates } : f
    ));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              Zugriff verweigert. Nur Administratoren können diese Seite aufrufen.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!settings) return null;

  const modelOptions = [
    { value: 'claude-haiku-3-5-20241022', label: 'Claude Haiku 3.5', desc: 'Schnell & günstig - ideal für einfache Aufgaben' },
    { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4', desc: 'Ausgewogen - beste Wahl für die meisten Aufgaben' },
    { value: 'claude-opus-4-20250514', label: 'Claude Opus 4', desc: 'Höchste Qualität - für komplexe Analysen' },
  ];

  const subscriptionTiers = ['free', 'starter', 'pro', 'business'];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Bot className="w-8 h-8" />
            KI-Einstellungen
          </h1>
          <p className="text-muted-foreground mt-1">
            Konfiguration und Überwachung der AI-Features
          </p>
        </div>
        <Button onClick={saveSettings} disabled={saving} className="vf-btn-gradient">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Speichern
        </Button>
      </div>

      {/* Budget-Übersicht */}
      <AIBudgetOverview />

      {/* Allgemeine Einstellungen */}
      <Card>
        <CardHeader>
          <CardTitle>⚙️ Allgemeine Einstellungen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">KI-Features aktiviert</Label>
              <p className="text-sm text-muted-foreground">Alle AI-Funktionen global an/ausschalten</p>
            </div>
            <Switch
              checked={settings.is_enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, is_enabled: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label>Standard-Modell</Label>
            <Select
              value={settings.default_model}
              onValueChange={(value) => setSettings({ ...settings, default_model: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {modelOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div>
                      <div className="font-medium">{opt.label}</div>
                      <div className="text-xs text-muted-foreground">{opt.desc}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {modelOptions.find(m => m.value === settings.default_model)?.desc}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label>Prompt-Caching</Label>
                <p className="text-xs text-muted-foreground">Bis zu 90% Ersparnis</p>
              </div>
              <Switch
                checked={settings.enable_prompt_caching}
                onCheckedChange={(checked) => setSettings({ ...settings, enable_prompt_caching: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label>Batch-Verarbeitung</Label>
                <p className="text-xs text-muted-foreground">Für Bulk-Operationen</p>
              </div>
              <Switch
                checked={settings.enable_batch_processing}
                onCheckedChange={(checked) => setSettings({ ...settings, enable_batch_processing: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget & Limits */}
      <Card>
        <CardHeader>
          <CardTitle>💰 Budget & Limits</CardTitle>
          <CardDescription>Kontrollieren Sie Ihre AI-Kosten</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Monatliches Budget (€)</Label>
              <Input
                type="number"
                min="0"
                max="1000"
                value={settings.monthly_budget_eur}
                onChange={(e) => setSettings({ ...settings, monthly_budget_eur: parseFloat(e.target.value) || 0 })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Warnung bei (%)</Label>
              <Input
                type="number"
                min="50"
                max="100"
                value={settings.budget_warning_threshold}
                onChange={(e) => setSettings({ ...settings, budget_warning_threshold: parseFloat(e.target.value) || 80 })}
              />
            </div>
          </div>

          <div className="pt-4 border-t">
            <Label className="mb-3 block">Rate-Limits pro User</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-normal">Pro Stunde</Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={settings.rate_limit_per_user_hour}
                  onChange={(e) => setSettings({ ...settings, rate_limit_per_user_hour: parseFloat(e.target.value) || 20 })}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-normal">Pro Tag</Label>
                <Input
                  type="number"
                  min="1"
                  max="500"
                  value={settings.rate_limit_per_user_day}
                  onChange={(e) => setSettings({ ...settings, rate_limit_per_user_day: parseFloat(e.target.value) || 100 })}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature-Konfiguration */}
      <Card>
        <CardHeader>
          <CardTitle>🎛️ Feature-Konfiguration</CardTitle>
          <CardDescription>Konfigurieren Sie jedes AI-Feature individuell</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2">Feature</th>
                  <th className="text-center py-3 px-2">Aktiv</th>
                  <th className="text-left py-3 px-2">Modell</th>
                  <th className="text-left py-3 px-2">Max Tokens</th>
                  <th className="text-left py-3 px-2">Min. Abo</th>
                </tr>
              </thead>
              <tbody>
                {features.map(feature => (
                  <tr key={feature.id} className="border-b">
                    <td className="py-3 px-2">
                      <div>
                        <div className="font-medium">{feature.display_name}</div>
                        {feature.description && (
                          <div className="text-xs text-muted-foreground">{feature.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <Switch
                        checked={feature.is_enabled}
                        onCheckedChange={(checked) => updateFeature(feature.id, { is_enabled: checked })}
                      />
                    </td>
                    <td className="py-3 px-2">
                      <Select
                        value={feature.preferred_model || settings.default_model}
                        onValueChange={(value) => updateFeature(feature.id, { preferred_model: value })}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="claude-haiku-3-5-20241022">Haiku 3.5</SelectItem>
                          <SelectItem value="claude-sonnet-4-20250514">Sonnet 4</SelectItem>
                          <SelectItem value="claude-opus-4-20250514">Opus 4</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-3 px-2">
                      <Input
                        type="number"
                        className="w-24"
                        value={feature.max_tokens}
                        onChange={(e) => updateFeature(feature.id, { max_tokens: parseInt(e.target.value) || 1024 })}
                      />
                    </td>
                    <td className="py-3 px-2">
                      <Select
                        value={feature.requires_subscription}
                        onValueChange={(value) => updateFeature(feature.id, { requires_subscription: value })}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {subscriptionTiers.map(tier => (
                            <SelectItem key={tier} value={tier}>
                              {tier.charAt(0).toUpperCase() + tier.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* API-Konfiguration */}
      <Card>
        <CardHeader>
          <CardTitle>🔑 API-Konfiguration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Label>Anthropic API-Key</Label>
                {apiStatus === 'active' && <CheckCircle className="w-4 h-4 text-green-600" />}
                {apiStatus === 'error' && <AlertCircle className="w-4 h-4 text-red-600" />}
                {apiStatus === 'unknown' && <AlertCircle className="w-4 h-4 text-gray-400" />}
              </div>
              <div className="text-sm font-mono">
                sk-ant-••••••••••••••••
              </div>
              {settings.last_api_check && (
                <div className="text-xs text-muted-foreground mt-1">
                  Letzter Check: {new Date(settings.last_api_check).toLocaleString('de-DE')}
                </div>
              )}
            </div>
            <Badge variant={apiStatus === 'active' ? 'default' : 'destructive'}>
              {apiStatus === 'active' ? 'Verbunden' : apiStatus === 'error' ? 'Fehler' : 'Unbekannt'}
            </Badge>
          </div>

          <Button 
            onClick={testAPIConnection} 
            disabled={testingApi}
            variant="outline"
          >
            {testingApi ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Teste...
              </>
            ) : (
              'API-Verbindung testen'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  function updateFeature(featureId, updates) {
    setFeatures(features.map(f => 
      f.id === featureId ? { ...f, ...updates } : f
    ));
  }
}