import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VfSwitch } from '@/components/shared/VfSwitch';
import { Bell } from 'lucide-react';

export default function AlertPreferences() {
  const [preferences, setPreferences] = useState({
    payment_reminders: true,
    contract_expiry: true,
    maintenance_updates: true,
    budget_alerts: false,
    tax_deadlines: true
  });

  const togglePreference = (key) => {
    setPreferences({ ...preferences, [key]: !preferences[key] });
  };

  const options = [
    { key: 'payment_reminders', label: 'Zahlungserinnerungen', description: 'Bei überfälligen Zahlungen' },
    { key: 'contract_expiry', label: 'Vertragsende', description: '60 Tage vor Ablauf' },
    { key: 'maintenance_updates', label: 'Wartungs-Updates', description: 'Status-Änderungen' },
    { key: 'budget_alerts', label: 'Budget-Warnungen', description: 'Bei 80% Budget erreicht' },
    { key: 'tax_deadlines', label: 'Steuerfristen', description: 'Anlage V & BK-Abrechnungen' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Benachrichtigungs-Einstellungen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {options.map((option) => (
            <div key={option.key} className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="font-medium text-sm">{option.label}</div>
                <div className="text-xs text-[var(--theme-text-muted)] mt-1">
                  {option.description}
                </div>
              </div>
              <VfSwitch
                checked={preferences[option.key]}
                onCheckedChange={() => togglePreference(option.key)}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}