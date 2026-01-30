import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function AIFeatureConfigManager() {
    const [configs, setConfigs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadConfigs();
    }, []);

    async function loadConfigs() {
        try {
            const data = await base44.entities.AIFeatureConfig.list();
            setConfigs(data);
        } catch (error) {
            toast.error('Fehler beim Laden');
        } finally {
            setLoading(false);
        }
    }

    async function toggleFeature(id, currentState) {
        try {
            await base44.entities.AIFeatureConfig.update(id, { 
                is_enabled: !currentState 
            });
            loadConfigs();
            toast.success(currentState ? 'Feature deaktiviert' : 'Feature aktiviert');
        } catch (error) {
            toast.error('Fehler');
        }
    }

    async function updateConfig(id, field, value) {
        try {
            await base44.entities.AIFeatureConfig.update(id, { [field]: value });
            loadConfigs();
            toast.success('Aktualisiert');
        } catch (error) {
            toast.error('Fehler');
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Feature-Konfiguration
                </CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="text-center py-8">Lädt...</div>
                ) : (
                    <div className="space-y-4">
                        {configs.map(config => (
                            <div key={config.id} className="p-4 border rounded-lg">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <div className="font-semibold">{config.display_name}</div>
                                        <div className="text-xs text-slate-500">{config.feature_key}</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Badge className={config.is_enabled ? 'bg-green-100 text-green-800' : ''}>
                                            {config.is_enabled ? 'Aktiv' : 'Inaktiv'}
                                        </Badge>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={config.is_enabled}
                                                onChange={() => toggleFeature(config.id, config.is_enabled)}
                                                className="vf-checkbox"
                                            />
                                        </label>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <label className="text-xs text-slate-600">Max Tokens:</label>
                                        <input
                                            type="number"
                                            value={config.max_tokens || 1024}
                                            onChange={(e) => updateConfig(config.id, 'max_tokens', parseInt(e.target.value))}
                                            className="vf-input mt-1"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-600">Abo-Level:</label>
                                        <select
                                            value={config.requires_subscription || 'free'}
                                            onChange={(e) => updateConfig(config.id, 'requires_subscription', e.target.value)}
                                            className="vf-select mt-1"
                                        >
                                            <option value="free">Kostenlos</option>
                                            <option value="starter">Starter</option>
                                            <option value="pro">Pro</option>
                                            <option value="business">Business</option>
                                        </select>
                                    </div>
                                </div>

                                {config.description && (
                                    <p className="text-xs text-slate-500 mt-2">{config.description}</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}