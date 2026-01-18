import React, { useState } from 'react';
import { VfInput } from '@/components/shared/VfInput';
import { VfSwitch } from '@/components/shared/VfSwitch';
import { Button } from '@/components/ui/button';
import { Shield, Save } from 'lucide-react';
import { showSuccess } from '@/components/notifications/ToastNotification';

export default function SecuritySettings() {
  const [settings, setSettings] = useState({
    twoFactorEnabled: false,
    emailNotifications: true,
    loginAlerts: true
  });

  const handleSave = () => {
    showSuccess('Sicherheitseinstellungen gespeichert');
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Sicherheit
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-[var(--theme-surface)] rounded-lg">
            <div>
              <div className="font-medium">Zwei-Faktor-Authentifizierung</div>
              <div className="text-sm text-[var(--theme-text-muted)]">Zusätzliche Sicherheit für Ihr Konto</div>
            </div>
            <VfSwitch 
              checked={settings.twoFactorEnabled}
              onCheckedChange={(v) => setSettings({ ...settings, twoFactorEnabled: v })}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-[var(--theme-surface)] rounded-lg">
            <div>
              <div className="font-medium">E-Mail-Benachrichtigungen</div>
              <div className="text-sm text-[var(--theme-text-muted)]">Bei wichtigen Ereignissen</div>
            </div>
            <VfSwitch 
              checked={settings.emailNotifications}
              onCheckedChange={(v) => setSettings({ ...settings, emailNotifications: v })}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-[var(--theme-surface)] rounded-lg">
            <div>
              <div className="font-medium">Login-Benachrichtigungen</div>
              <div className="text-sm text-[var(--theme-text-muted)]">Bei neuen Anmeldungen</div>
            </div>
            <VfSwitch 
              checked={settings.loginAlerts}
              onCheckedChange={(v) => setSettings({ ...settings, loginAlerts: v })}
            />
          </div>
        </div>
      </div>

      <Button variant="gradient" onClick={handleSave}>
        <Save className="h-4 w-4 mr-2" />
        Speichern
      </Button>
    </div>
  );
}