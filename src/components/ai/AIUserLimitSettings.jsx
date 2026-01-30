import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Save, Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function AIUserLimitSettings() {
    const [user, setUser] = useState(null);
    const [hourlyLimit, setHourlyLimit] = useState(20);
    const [dailyLimit, setDailyLimit] = useState(100);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadUserSettings();
    }, []);

    async function loadUserSettings() {
        const u = await base44.auth.me();
        setUser(u);

        // Lade gespeicherte Limits falls vorhanden
        if (u.ai_rate_limit_hour) setHourlyLimit(u.ai_rate_limit_hour);
        if (u.ai_rate_limit_day) setDailyLimit(u.ai_rate_limit_day);
    }

    async function handleSave() {
        setSaving(true);
        try {
            await base44.auth.updateMe({
                ai_rate_limit_hour: hourlyLimit,
                ai_rate_limit_day: dailyLimit
            });
            toast.success('Limits gespeichert');
        } catch (error) {
            toast.error('Fehler beim Speichern');
        } finally {
            setSaving(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Meine AI-Nutzungslimits
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <div>
                        <Label>Stündliches Limit: {hourlyLimit} Anfragen</Label>
                        <Slider
                            value={[hourlyLimit]}
                            onValueChange={(v) => setHourlyLimit(v[0])}
                            min={1}
                            max={100}
                            step={5}
                            className="mt-2"
                        />
                        <div className="text-xs text-slate-600 mt-1">
                            Standard: 20 Anfragen/Stunde
                        </div>
                    </div>

                    <div>
                        <Label>Tägliches Limit: {dailyLimit} Anfragen</Label>
                        <Slider
                            value={[dailyLimit]}
                            onValueChange={(v) => setDailyLimit(v[0])}
                            min={10}
                            max={500}
                            step={10}
                            className="mt-2"
                        />
                        <div className="text-xs text-slate-600 mt-1">
                            Standard: 100 Anfragen/Tag
                        </div>
                    </div>
                </div>

                <Button onClick={handleSave} disabled={saving} className="w-full">
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Speichert...' : 'Limits speichern'}
                </Button>

                <div className="text-xs text-slate-500">
                    Diese Limits schützen dich vor versehentlich hohen Kosten. 
                    Bei Überschreitung erhältst du eine Benachrichtigung.
                </div>
            </CardContent>
        </Card>
    );
}