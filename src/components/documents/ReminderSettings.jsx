import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Clock, Slack } from 'lucide-react';

export default function ReminderSettings() {
  const [settings, setSettings] = useState({
    send_task_reminders: true,
    task_reminder_days: [1, 3],
    send_overdue_alerts: true,
    notify_rule_execution: true,
    notify_status_changes: true,
    send_via_slack: true,
    send_in_app: true
  });

  const days = [1, 3, 5, 7];

  const toggleDay = (day) => {
    setSettings(prev => ({
      ...prev,
      task_reminder_days: prev.task_reminder_days.includes(day)
        ? prev.task_reminder_days.filter(d => d !== day)
        : [...prev.task_reminder_days, day].sort((a, b) => a - b)
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="w-5 h-5" />
          Benachrichtigungseinstellungen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Task Reminders */}
        <div className="space-y-3 pb-4 border-b">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Aufgabenerinnerungen</label>
            <Switch
              checked={settings.send_task_reminders}
              onCheckedChange={(value) => setSettings({ ...settings, send_task_reminders: value })}
            />
          </div>
          {settings.send_task_reminders && (
            <div>
              <p className="text-xs text-slate-600 mb-2">Erinnern Sie mich Tage vor Fälligkeitsdatum:</p>
              <div className="flex gap-2">
                {days.map(day => (
                  <Button
                    key={day}
                    size="sm"
                    variant={settings.task_reminder_days.includes(day) ? 'default' : 'outline'}
                    onClick={() => toggleDay(day)}
                    className="text-xs"
                  >
                    {day}d
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Overdue Alerts */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Überfällig-Benachrichtigungen</label>
          <Switch
            checked={settings.send_overdue_alerts}
            onCheckedChange={(value) => setSettings({ ...settings, send_overdue_alerts: value })}
          />
        </div>

        {/* Rule Execution */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Regel-Ausführungsbenachrichtigungen</label>
          <Switch
            checked={settings.notify_rule_execution}
            onCheckedChange={(value) => setSettings({ ...settings, notify_rule_execution: value })}
          />
        </div>

        {/* Status Changes */}
        <div className="flex items-center justify-between pb-4 border-b">
          <label className="text-sm font-medium">Status-Änderungsbenachrichtigungen</label>
          <Switch
            checked={settings.notify_status_changes}
            onCheckedChange={(value) => setSettings({ ...settings, notify_status_changes: value })}
          />
        </div>

        {/* Channels */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Benachrichtigungskanäle</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-600 flex items-center gap-2">
                <Slack className="w-4 h-4" />
                Slack
              </label>
              <Switch
                checked={settings.send_via_slack}
                onCheckedChange={(value) => setSettings({ ...settings, send_via_slack: value })}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-600">In-App</label>
              <Switch
                checked={settings.send_in_app}
                onCheckedChange={(value) => setSettings({ ...settings, send_in_app: value })}
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <Button className="w-full" onClick={() => console.log('Settings saved:', settings)}>
          Einstellungen speichern
        </Button>
      </CardContent>
    </Card>
  );
}