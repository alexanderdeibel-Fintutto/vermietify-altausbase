import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VfInput } from '@/components/shared/VfInput';
import { VfSwitch } from '@/components/shared/VfSwitch';
import { Settings, Save, Bell, Mail, Shield, Database } from 'lucide-react';
import { showSuccess } from '@/components/notifications/ToastNotification';

export default function SystemSettings() {
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [pushNotifications, setPushNotifications] = useState(true);
    const [autoBackup, setAutoBackup] = useState(false);

    const { data: currentUser } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me()
    });

    const handleSave = () => {
        showSuccess('Einstellungen gespeichert');
    };

    return (
        <div className="max-w-4xl space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Systemeinstellungen</h1>
                    <p className="vf-page-subtitle">Konfigurieren Sie Ihre Anwendung</p>
                </div>
            </div>

            {/* Notifications */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Bell className="w-5 h-5" />
                        <CardTitle>Benachrichtigungen</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-medium">E-Mail Benachrichtigungen</div>
                            <div className="text-sm text-gray-600">Erhalten Sie wichtige Updates per E-Mail</div>
                        </div>
                        <VfSwitch
                            checked={emailNotifications}
                            onChange={setEmailNotifications}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-medium">Push-Benachrichtigungen</div>
                            <div className="text-sm text-gray-600">Browser-Benachrichtigungen aktivieren</div>
                        </div>
                        <VfSwitch
                            checked={pushNotifications}
                            onChange={setPushNotifications}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Data & Backup */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Database className="w-5 h-5" />
                        <CardTitle>Daten & Sicherung</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-medium">Automatische Backups</div>
                            <div className="text-sm text-gray-600">Täglich um 2:00 Uhr</div>
                        </div>
                        <VfSwitch
                            checked={autoBackup}
                            onChange={setAutoBackup}
                        />
                    </div>
                    <div className="pt-4 border-t">
                        <Button variant="outline">
                            <Database className="w-4 h-4 mr-2" />
                            Daten exportieren
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Security */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        <CardTitle>Sicherheit</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <VfInput
                        label="Aktuelles Passwort"
                        type="password"
                        placeholder="••••••••"
                    />
                    <VfInput
                        label="Neues Passwort"
                        type="password"
                        placeholder="••••••••"
                    />
                    <VfInput
                        label="Passwort bestätigen"
                        type="password"
                        placeholder="••••••••"
                    />
                    <Button variant="outline" className="mt-4">
                        Passwort ändern
                    </Button>
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button className="vf-btn-gradient" onClick={handleSave}>
                    <Save className="w-4 h-4" />
                    Einstellungen speichern
                </Button>
            </div>
        </div>
    );
}