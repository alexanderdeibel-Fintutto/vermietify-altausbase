import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VfSwitch } from '@/components/shared/VfSwitch';
import { Bell } from 'lucide-react';

export default function NotificationSettings() {
  const [settings, setSettings] = useState({
    email_notifications: true,
    payment_reminders: true,
    contract_expiry: true,
    maintenance_updates: true,
    marketing_emails: false
  });

  const handleToggle = (key) => {
    setSettings({ ...settings, [key]: !settings[key] });
  };

  const options = [
    { key: 'email_notifications', label: 'E-Mail Benachrichtigungen', description: 'Wichtige Updates per E-Mail' },
    { key: 'payment_reminders', label: 'Zahlungserinnerungen', description: 'Bei fälligen Zahlungen' },
    { key: 'contract_expiry', label: 'Vertragsende-Hinweise', description: '30 Tage vor Vertragsende' },
    { key: 'maintenance_updates', label: 'Wartungs-Updates', description: 'Status von Wartungsanfragen' },
    { key: 'marketing_emails', label: 'Marketing-E-Mails', description: 'Tipps & Neuigkeiten' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Benachrichtigungseinstellungen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {options.map((option) => (
          <div key={option.key} className="flex items-start justify-between">
            <div className="flex-1">
              <div className="font-medium text-sm">{option.label}</div>
              <div className="text-xs text-[var(--theme-text-muted)]">{option.description}</div>
            </div>
            <VfSwitch
              checked={settings[option.key]}
              onCheckedChange={() => handleToggle(option.key)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}