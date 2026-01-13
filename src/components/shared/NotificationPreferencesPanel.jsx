import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Bell, Mail, MessageSquare, Clock } from 'lucide-react';
import { Loader2 } from 'lucide-react';

export default function NotificationPreferencesPanel({
  onSave,
  loading = false,
}) {
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: true,
    inAppNotifications: true,
    dailyDigest: true,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
  });

  const handleChange = (key, value) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    await onSave?.(preferences);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Benachrichtigungseinstellungen
        </CardTitle>
        <CardDescription>
          Verwalten Sie Ihre Benachrichtigungsprefesenzen
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium">Email-Benachrichtigungen</span>
            </div>
            <Switch
              checked={preferences.emailNotifications}
              onCheckedChange={(val) => handleChange('emailNotifications', val)}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium">Push-Benachrichtigungen</span>
            </div>
            <Switch
              checked={preferences.pushNotifications}
              onCheckedChange={(val) => handleChange('pushNotifications', val)}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium">In-App-Benachrichtigungen</span>
            </div>
            <Switch
              checked={preferences.inAppNotifications}
              onCheckedChange={(val) => handleChange('inAppNotifications', val)}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium">Täglicher Digest</span>
            </div>
            <Switch
              checked={preferences.dailyDigest}
              onCheckedChange={(val) => handleChange('dailyDigest', val)}
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3">Ruhezeiten</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-600">Von</label>
              <input
                type="time"
                value={preferences.quietHoursStart}
                onChange={(e) => handleChange('quietHoursStart', e.target.value)}
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600">Bis</label>
              <input
                type="time"
                value={preferences.quietHoursEnd}
                onChange={(e) => handleChange('quietHoursEnd', e.target.value)}
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Wird gespeichert...
            </>
          ) : (
            'Speichern'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}