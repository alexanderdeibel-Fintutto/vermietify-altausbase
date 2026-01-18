import React, { useState } from 'react';
import { VfSwitch } from '@/components/shared/VfSwitch';
import { Button } from '@/components/ui/button';
import { Bell, Save } from 'lucide-react';
import { showSuccess } from '@/components/notifications/ToastNotification';

export default function NotificationSettings() {
  const [settings, setSettings] = useState({
    newTenant: true,
    paymentOverdue: true,
    contractExpiring: true,
    maintenanceRequest: true,
    systemUpdates: false
  });

  const handleSave = () => {
    showSuccess('Benachrichtigungseinstellungen gespeichert');
  };

  const notifications = [
    { key: 'newTenant', label: 'Neuer Mieter', description: 'Wenn ein neuer Mieter angelegt wird' },
    { key: 'paymentOverdue', label: 'Überfällige Zahlung', description: 'Bei Zahlungsverzug' },
    { key: 'contractExpiring', label: 'Vertrag läuft aus', description: '90 Tage vor Vertragsende' },
    { key: 'maintenanceRequest', label: 'Wartungsanfrage', description: 'Bei neuen Wartungsanfragen' },
    { key: 'systemUpdates', label: 'System-Updates', description: 'Über neue Features' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Benachrichtigungen
        </h3>
        
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div key={notif.key} className="flex items-center justify-between p-4 bg-[var(--theme-surface)] rounded-lg">
              <div>
                <div className="font-medium">{notif.label}</div>
                <div className="text-sm text-[var(--theme-text-muted)]">{notif.description}</div>
              </div>
              <VfSwitch 
                checked={settings[notif.key]}
                onCheckedChange={(v) => setSettings({ ...settings, [notif.key]: v })}
              />
            </div>
          ))}
        </div>
      </div>

      <Button variant="gradient" onClick={handleSave}>
        <Save className="h-4 w-4 mr-2" />
        Speichern
      </Button>
    </div>
  );
}