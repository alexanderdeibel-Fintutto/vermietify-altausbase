import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Bell, Volume2, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function RefreshSettings({ open, onOpenChange }) {
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('support-refresh-settings');
        return saved ? JSON.parse(saved) : {
            autoRefresh: true,
            frequency: '30',
            soundEnabled: false,
            desktopNotifications: false,
            workHoursOnly: false,
            startHour: '09:00',
            endHour: '17:00'
        };
    });

    const handleSave = () => {
        localStorage.setItem('support-refresh-settings', JSON.stringify(settings));
        toast.success('Einstellungen gespeichert');
        onOpenChange(false);
        
        // Event für andere Komponenten
        window.dispatchEvent(new CustomEvent('refresh-settings-changed', { detail: settings }));
    };

    const requestNotificationPermission = () => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    setSettings({ ...settings, desktopNotifications: true });
                    toast.success('Benachrichtigungen aktiviert');
                } else {
                    toast.error('Benachrichtigungen abgelehnt');
                }
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Auto-Refresh Einstellungen
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Auto-Refresh */}
                    <div className="flex items-center justify-between">
                        <div>
                            <Label className="text-base">Auto-Refresh aktiviert</Label>
                            <p className="text-sm text-slate-600">Automatische Aktualisierung der Daten</p>
                        </div>
                        <Switch
                            checked={settings.autoRefresh}
                            onCheckedChange={(checked) => setSettings({ ...settings, autoRefresh: checked })}
                        />
                    </div>

                    {/* Frequenz */}
                    {settings.autoRefresh && (
                        <div>
                            <Label className="flex items-center gap-2 mb-2">
                                <Clock className="w-4 h-4" />
                                Update-Frequenz
                            </Label>
                            <Select
                                value={settings.frequency}
                                onValueChange={(value) => setSettings({ ...settings, frequency: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">Alle 10 Sekunden (Kritisch)</SelectItem>
                                    <SelectItem value="30">Alle 30 Sekunden (Standard)</SelectItem>
                                    <SelectItem value="60">Alle 60 Sekunden</SelectItem>
                                    <SelectItem value="300">Alle 5 Minuten</SelectItem>
                                    <SelectItem value="600">Alle 10 Minuten</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Sound */}
                    <div className="flex items-center justify-between">
                        <div>
                            <Label className="text-base flex items-center gap-2">
                                <Volume2 className="w-4 h-4" />
                                Sound bei kritischen Tickets
                            </Label>
                            <p className="text-sm text-slate-600">Ton abspielen bei neuen kritischen Problemen</p>
                        </div>
                        <Switch
                            checked={settings.soundEnabled}
                            onCheckedChange={(checked) => setSettings({ ...settings, soundEnabled: checked })}
                        />
                    </div>

                    {/* Desktop-Benachrichtigungen */}
                    <div className="flex items-center justify-between">
                        <div>
                            <Label className="text-base flex items-center gap-2">
                                <Bell className="w-4 h-4" />
                                Desktop-Benachrichtigungen
                            </Label>
                            <p className="text-sm text-slate-600">Browser-Benachrichtigungen für kritische Tickets</p>
                        </div>
                        <Switch
                            checked={settings.desktopNotifications}
                            onCheckedChange={(checked) => {
                                if (checked && 'Notification' in window && Notification.permission !== 'granted') {
                                    requestNotificationPermission();
                                } else {
                                    setSettings({ ...settings, desktopNotifications: checked });
                                }
                            }}
                        />
                    </div>

                    {/* Arbeitszeiten */}
                    <div className="flex items-center justify-between">
                        <div>
                            <Label className="text-base">Nur während Arbeitszeiten</Label>
                            <p className="text-sm text-slate-600">Updates nur in definiertem Zeitfenster</p>
                        </div>
                        <Switch
                            checked={settings.workHoursOnly}
                            onCheckedChange={(checked) => setSettings({ ...settings, workHoursOnly: checked })}
                        />
                    </div>

                    {settings.workHoursOnly && (
                        <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-emerald-200">
                            <div>
                                <Label>Start-Zeit</Label>
                                <input
                                    type="time"
                                    value={settings.startHour}
                                    onChange={(e) => setSettings({ ...settings, startHour: e.target.value })}
                                    className="w-full p-2 border rounded mt-1"
                                />
                            </div>
                            <div>
                                <Label>End-Zeit</Label>
                                <input
                                    type="time"
                                    value={settings.endHour}
                                    onChange={(e) => setSettings({ ...settings, endHour: e.target.value })}
                                    className="w-full p-2 border rounded mt-1"
                                />
                            </div>
                        </div>
                    )}

                    {/* Info */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-800">
                            💡 <strong>Tipp:</strong> Auto-Refresh pausiert automatisch bei inaktivem Browser-Tab,
                            um Ressourcen zu schonen. Updates werden beim Zurückkehren nachgeholt.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Abbrechen
                    </Button>
                    <Button onClick={handleSave}>
                        Speichern
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}