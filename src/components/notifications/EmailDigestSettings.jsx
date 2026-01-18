import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VfSelect } from '@/components/shared/VfSelect';
import { VfSwitch } from '@/components/shared/VfSwitch';
import { Button } from '@/components/ui/button';
import { Mail, Save } from 'lucide-react';
import { showSuccess } from '@/components/notifications/ToastNotification';

export default function EmailDigestSettings() {
  const [settings, setSettings] = useState({
    enabled: true,
    frequency: 'daily',
    time: '09:00'
  });

  const handleSave = () => {
    showSuccess('E-Mail-Einstellungen gespeichert');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          E-Mail-Zusammenfassung
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-[var(--theme-surface)] rounded-lg">
            <div>
              <div className="font-medium">Zusammenfassung aktivieren</div>
              <div className="text-sm text-[var(--theme-text-muted)]">Tägliche E-Mail mit Aktivitäten</div>
            </div>
            <VfSwitch 
              checked={settings.enabled}
              onCheckedChange={(v) => setSettings({ ...settings, enabled: v })}
            />
          </div>

          {settings.enabled && (
            <>
              <VfSelect
                label="Häufigkeit"
                value={settings.frequency}
                onChange={(v) => setSettings({ ...settings, frequency: v })}
                options={[
                  { value: 'daily', label: 'Täglich' },
                  { value: 'weekly', label: 'Wöchentlich' },
                  { value: 'monthly', label: 'Monatlich' }
                ]}
              />

              <VfSelect
                label="Uhrzeit"
                value={settings.time}
                onChange={(v) => setSettings({ ...settings, time: v })}
                options={[
                  { value: '06:00', label: '06:00 Uhr' },
                  { value: '09:00', label: '09:00 Uhr' },
                  { value: '12:00', label: '12:00 Uhr' },
                  { value: '18:00', label: '18:00 Uhr' }
                ]}
              />
            </>
          )}

          <Button variant="gradient" className="w-full" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Speichern
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}