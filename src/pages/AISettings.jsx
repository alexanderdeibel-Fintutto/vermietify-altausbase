import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Key, Euro, Settings as SettingsIcon, BarChart3, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function AISettings() {
    const queryClient = useQueryClient();
    const [showClaudeKey, setShowClaudeKey] = useState(false);
    const [showOpenAIKey, setShowOpenAIKey] = useState(false);
    const [editMode, setEditMode] = useState(false);

    const { data: settings, isLoading: loadingSettings } = useQuery({
        queryKey: ['aiSettings'],
        queryFn: async () => {
            const list = await base44.entities.AISettings.list();
            return list[0] || null;
        }
    });

    const { data: features = [], isLoading: loadingFeatures } = useQuery({
        queryKey: ['aiFeatures'],
        queryFn: () => base44.entities.AIFeatureConfig.list()
    });

    const { data: logs = [] } = useQuery({
        queryKey: ['aiLogs'],
        queryFn: () => base44.entities.AIUsageLog.list('-created_date', 50)
    });

    const initMutation = useMutation({
        mutationFn: () => base44.functions.invoke('initializeAIFeatures', {}),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['aiFeatures'] });
            toast.success('AI-Features initialisiert');
        }
    });

    const saveSettingsMutation = useMutation({
        mutationFn: async (data) => {
            if (settings?.id) {
                return base44.entities.AISettings.update(settings.id, data);
            } else {
                return base44.entities.AISettings.create(data);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['aiSettings'] });
            toast.success('Einstellungen gespeichert');
            setEditMode(false);
        }
    });

    const toggleFeatureMutation = useMutation({
        mutationFn: ({ id, enabled }) => base44.entities.AIFeatureConfig.update(id, { enabled }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['aiFeatures'] });
        }
    });

    const monthlyStats = React.useMemo(() => {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const thisMonth = logs.filter(log => new Date(log.created_date) >= startOfMonth && log.success);
        
        return {
            requests: thisMonth.length,
            tokens: thisMonth.reduce((sum, log) => sum + (log.input_tokens || 0) + (log.output_tokens || 0), 0),
            cost: thisMonth.reduce((sum, log) => sum + (log.estimated_cost_eur || 0), 0)
        };
    }, [logs]);

    const budgetPercent = settings?.monthly_budget_eur ? (monthlyStats.cost / settings.monthly_budget_eur) * 100 : 0;

    if (loadingSettings || loadingFeatures) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        );
    }

    if (!features.length) {
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Brain className="w-5 h-5" />
                            KI-Features initialisieren
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-slate-600 mb-4">Die KI-Features müssen zuerst initialisiert werden.</p>
                        <Button onClick={() => initMutation.mutate()} disabled={initMutation.isPending}>
                            {initMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Features initialisieren
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Brain className="w-6 h-6" />
                        KI-Einstellungen
                    </h1>
                    <p className="text-slate-600 mt-1">Verwalten Sie alle KI-Features und API-Zugriffe</p>
                </div>
            </div>

            {/* Monatsübersicht */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Übersicht diesen Monat
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-6 mb-4">
                        <div>
                            <div className="text-sm text-slate-600">Anfragen</div>
                            <div className="text-2xl font-bold">{monthlyStats.requests.toLocaleString('de-DE')}</div>
                        </div>
                        <div>
                            <div className="text-sm text-slate-600">Tokens</div>
                            <div className="text-2xl font-bold">{monthlyStats.tokens.toLocaleString('de-DE')}</div>
                        </div>
                        <div>
                            <div className="text-sm text-slate-600">Kosten</div>
                            <div className="text-2xl font-bold">{monthlyStats.cost.toFixed(2)} €</div>
                        </div>
                    </div>
                    {settings?.monthly_budget_eur && (
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-slate-600">Budget-Nutzung</span>
                                <span className={budgetPercent >= (settings.budget_warning_threshold || 80) ? 'text-orange-600 font-semibold' : 'text-slate-600'}>
                                    {budgetPercent.toFixed(0)}% von {settings.monthly_budget_eur} €
                                </span>
                            </div>
                            <Progress value={Math.min(budgetPercent, 100)} className="h-2" />
                        </div>
                    )}
                </CardContent>
            </Card>

            <Tabs defaultValue="config">
                <TabsList>
                    <TabsTrigger value="config">
                        <Key className="w-4 h-4 mr-2" />
                        API-Konfiguration
                    </TabsTrigger>
                    <TabsTrigger value="features">
                        <Brain className="w-4 h-4 mr-2" />
                        KI-Features
                    </TabsTrigger>
                    <TabsTrigger value="logs">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Nutzungs-Log
                    </TabsTrigger>
                </TabsList>

                {/* API-Konfiguration */}
                <TabsContent value="config">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Key className="w-5 h-5" />
                                    API-Keys & Einstellungen
                                </CardTitle>
                                {!editMode && (
                                    <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                                        Bearbeiten
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.target);
                                saveSettingsMutation.mutate({
                                    claude_api_key: formData.get('claude_api_key') || settings?.claude_api_key,
                                    claude_enabled: formData.get('claude_enabled') === 'on',
                                    claude_default_model: formData.get('claude_default_model'),
                                    openai_api_key: formData.get('openai_api_key') || settings?.openai_api_key,
                                    openai_enabled: formData.get('openai_enabled') === 'on',
                                    preferred_provider: formData.get('preferred_provider'),
                                    monthly_budget_eur: parseFloat(formData.get('monthly_budget_eur')) || null,
                                    budget_warning_threshold: parseInt(formData.get('budget_warning_threshold')) || 80
                                });
                            }}>
                                {/* Claude */}
                                <div className="space-y-4 p-4 border rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-base font-semibold">Claude (Anthropic)</Label>
                                        <Switch name="claude_enabled" defaultChecked={settings?.claude_enabled} disabled={!editMode} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>API-Key</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                name="claude_api_key"
                                                type={showClaudeKey ? "text" : "password"}
                                                placeholder="sk-ant-..."
                                                defaultValue={settings?.claude_api_key}
                                                disabled={!editMode}
                                                className="font-mono text-xs"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={() => setShowClaudeKey(!showClaudeKey)}
                                            >
                                                {showClaudeKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Standard-Modell</Label>
                                        <Select name="claude_default_model" defaultValue={settings?.claude_default_model || "claude-sonnet-4-5-20250929"} disabled={!editMode}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (schnell, günstig)</SelectItem>
                                                <SelectItem value="claude-sonnet-4-5-20250929">Claude Sonnet 4.5 (empfohlen)</SelectItem>
                                                <SelectItem value="claude-opus-4-5-20251101">Claude Opus 4.5 (Premium)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* OpenAI */}
                                <div className="space-y-4 p-4 border rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-base font-semibold">OpenAI</Label>
                                        <Switch name="openai_enabled" defaultChecked={settings?.openai_enabled} disabled={!editMode} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>API-Key</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                name="openai_api_key"
                                                type={showOpenAIKey ? "text" : "password"}
                                                placeholder="sk-..."
                                                defaultValue={settings?.openai_api_key}
                                                disabled={!editMode}
                                                className="font-mono text-xs"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                                            >
                                                {showOpenAIKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Provider-Auswahl */}
                                <div className="space-y-2">
                                    <Label>Bevorzugter Provider</Label>
                                    <Select name="preferred_provider" defaultValue={settings?.preferred_provider || "auto"} disabled={!editMode}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="auto">Auto (intelligente Auswahl)</SelectItem>
                                            <SelectItem value="claude">Claude bevorzugen</SelectItem>
                                            <SelectItem value="openai">OpenAI bevorzugen</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Budget */}
                                <div className="space-y-4 p-4 border rounded-lg">
                                    <Label className="text-base font-semibold flex items-center gap-2">
                                        <Euro className="w-4 h-4" />
                                        Budget-Verwaltung
                                    </Label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Monatsbudget (€)</Label>
                                            <Input
                                                name="monthly_budget_eur"
                                                type="number"
                                                step="0.01"
                                                placeholder="Unbegrenzt"
                                                defaultValue={settings?.monthly_budget_eur || ''}
                                                disabled={!editMode}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Warnung bei (%)</Label>
                                            <Input
                                                name="budget_warning_threshold"
                                                type="number"
                                                defaultValue={settings?.budget_warning_threshold || 80}
                                                disabled={!editMode}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {editMode && (
                                    <div className="flex gap-2">
                                        <Button type="submit" disabled={saveSettingsMutation.isPending}>
                                            {saveSettingsMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                            Speichern
                                        </Button>
                                        <Button type="button" variant="outline" onClick={() => setEditMode(false)}>
                                            Abbrechen
                                        </Button>
                                    </div>
                                )}
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Features */}
                <TabsContent value="features">
                    <Card>
                        <CardHeader>
                            <CardTitle>KI-Features verwalten</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="grid grid-cols-6 gap-4 text-sm font-semibold text-slate-600 pb-2 border-b">
                                    <div className="col-span-2">Feature</div>
                                    <div className="text-center">Status</div>
                                    <div className="text-right">Heute</div>
                                    <div className="text-right">Gesamt</div>
                                    <div className="text-right">Kosten</div>
                                </div>
                                {features.map(feature => (
                                    <div key={feature.id} className="grid grid-cols-6 gap-4 items-center py-3 border-b hover:bg-slate-50 rounded px-2">
                                        <div className="col-span-2">
                                            <div className="font-medium text-slate-900">{feature.feature_name}</div>
                                            <div className="text-xs text-slate-500">{feature.feature_description}</div>
                                        </div>
                                        <div className="text-center">
                                            <Switch
                                                checked={feature.enabled}
                                                onCheckedChange={(enabled) => toggleFeatureMutation.mutate({ id: feature.id, enabled })}
                                            />
                                        </div>
                                        <div className="text-right text-slate-700">{feature.requests_today || 0}</div>
                                        <div className="text-right text-slate-700">{(feature.total_requests || 0).toLocaleString('de-DE')}</div>
                                        <div className="text-right font-semibold text-slate-900">{(feature.estimated_cost_eur || 0).toFixed(2)} €</div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Logs */}
                <TabsContent value="logs">
                    <Card>
                        <CardHeader>
                            <CardTitle>Nutzungs-Log (letzte 50)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="grid grid-cols-6 gap-4 text-sm font-semibold text-slate-600 pb-2 border-b">
                                    <div>Zeit</div>
                                    <div className="col-span-2">Feature</div>
                                    <div>Provider</div>
                                    <div className="text-right">Tokens</div>
                                    <div className="text-right">Kosten</div>
                                </div>
                                {logs.map(log => (
                                    <div key={log.id} className="grid grid-cols-6 gap-4 items-center py-2 text-sm border-b hover:bg-slate-50 rounded px-2">
                                        <div className="text-slate-600">
                                            {format(new Date(log.created_date), 'HH:mm')}
                                        </div>
                                        <div className="col-span-2 text-slate-900">
                                            {features.find(f => f.feature_key === log.feature_key)?.feature_name || log.feature_key}
                                        </div>
                                        <div className="text-slate-700 capitalize">{log.provider}</div>
                                        <div className="text-right text-slate-700">
                                            {((log.input_tokens || 0) + (log.output_tokens || 0)).toLocaleString('de-DE')}
                                        </div>
                                        <div className="text-right font-medium text-slate-900">
                                            {(log.estimated_cost_eur || 0).toFixed(4)} €
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}