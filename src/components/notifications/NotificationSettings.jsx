import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell, Mail, Smartphone, Moon, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function NotificationSettings() {
  const [preferences, setPreferences] = useState(null);
  const [pushSupported, setPushSupported] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: existingPreferences } = useQuery({
    queryKey: ['notificationPreferences', user?.email],
    queryFn: async () => {
      const prefs = await base44.entities.NotificationPreference.filter({ user_email: user.email }, null, 1);
      return prefs[0];
    },
    enabled: !!user?.email
  });

  useEffect(() => {
    if (existingPreferences) {
      setPreferences(existingPreferences);
    } else if (user?.email) {
      setPreferences({
        user_email: user.email,
        email_enabled: true,
        in_app_enabled: true,
        push_enabled: false,
        payment_reminders: true,
        maintenance_updates: true,
        contract_renewals: true,
        new_messages: true,
        support_tickets: true,
        system_updates: false,
        priority_filter: 'all',
        quiet_hours_enabled: false,
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00'
      });
    }

    // Check push notification support
    setPushSupported('Notification' in window && 'serviceWorker' in navigator);
  }, [existingPreferences, user]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (existingPreferences?.id) {
        return await base44.entities.NotificationPreference.update(existingPreferences.id, data);
      } else {
        return await base44.entities.NotificationPreference.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationPreferences'] });
      toast.success('Einstellungen gespeichert');
    }
  });

  const requestPushPermission = async () => {
    if (!pushSupported) {
      toast.error('Push-Benachrichtigungen werden nicht unterstützt');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setPreferences({ ...preferences, push_enabled: true });
      toast.success('Push-Benachrichtigungen aktiviert');
    } else {
      toast.error('Push-Benachrichtigungen abgelehnt');
    }
  };

  if (!preferences) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-light text-slate-900">Benachrichtigungseinstellungen</h2>
        <p className="text-sm text-slate-600 mt-1">Verwalten Sie Ihre Benachrichtigungspräferenzen</p>
      </div>

      {/* Channels */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Benachrichtigungskanäle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-slate-600" />
              <div>
                <Label>In-App-Benachrichtigungen</Label>
                <p className="text-xs text-slate-500">Benachrichtigungen im Portal</p>
              </div>
            </div>
            <Switch
              checked={preferences.in_app_enabled}
              onCheckedChange={(v) => setPreferences({ ...preferences, in_app_enabled: v })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-slate-600" />
              <div>
                <Label>E-Mail-Benachrichtigungen</Label>
                <p className="text-xs text-slate-500">Benachrichtigungen per E-Mail</p>
              </div>
            </div>
            <Switch
              checked={preferences.email_enabled}
              onCheckedChange={(v) => setPreferences({ ...preferences, email_enabled: v })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="w-4 h-4 text-slate-600" />
              <div>
                <Label>Push-Benachrichtigungen</Label>
                <p className="text-xs text-slate-500">Browser-Push-Benachrichtigungen</p>
                {!pushSupported && (
                  <p className="text-xs text-amber-600">Nicht unterstützt in diesem Browser</p>
                )}
              </div>
            </div>
            {preferences.push_enabled ? (
              <Switch
                checked={preferences.push_enabled}
                onCheckedChange={(v) => setPreferences({ ...preferences, push_enabled: v })}
              />
            ) : (
              <Button size="sm" onClick={requestPushPermission} disabled={!pushSupported}>
                Aktivieren
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Benachrichtigungstypen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Zahlungserinnerungen</Label>
            <Switch
              checked={preferences.payment_reminders}
              onCheckedChange={(v) => setPreferences({ ...preferences, payment_reminders: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Wartungsupdates</Label>
            <Switch
              checked={preferences.maintenance_updates}
              onCheckedChange={(v) => setPreferences({ ...preferences, maintenance_updates: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Vertragsverlängerungen</Label>
            <Switch
              checked={preferences.contract_renewals}
              onCheckedChange={(v) => setPreferences({ ...preferences, contract_renewals: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Neue Nachrichten</Label>
            <Switch
              checked={preferences.new_messages}
              onCheckedChange={(v) => setPreferences({ ...preferences, new_messages: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Support-Tickets</Label>
            <Switch
              checked={preferences.support_tickets}
              onCheckedChange={(v) => setPreferences({ ...preferences, support_tickets: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>System-Updates</Label>
            <Switch
              checked={preferences.system_updates}
              onCheckedChange={(v) => setPreferences({ ...preferences, system_updates: v })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Priority Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Prioritätsfilter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label className="mb-2 block">Nur Benachrichtigungen ab dieser Priorität anzeigen</Label>
          <Select
            value={preferences.priority_filter}
            onValueChange={(v) => setPreferences({ ...preferences, priority_filter: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Benachrichtigungen</SelectItem>
              <SelectItem value="high">Nur hohe & kritische</SelectItem>
              <SelectItem value="critical">Nur kritische</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Moon className="w-4 h-4" />
            Ruhemodus
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Ruhemodus aktivieren</Label>
            <Switch
              checked={preferences.quiet_hours_enabled}
              onCheckedChange={(v) => setPreferences({ ...preferences, quiet_hours_enabled: v })}
            />
          </div>

          {preferences.quiet_hours_enabled && (
            <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded">
              <div>
                <Label className="text-xs">Von</Label>
                <Input
                  type="time"
                  value={preferences.quiet_hours_start}
                  onChange={(e) => setPreferences({ ...preferences, quiet_hours_start: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Bis</Label>
                <Input
                  type="time"
                  value={preferences.quiet_hours_end}
                  onChange={(e) => setPreferences({ ...preferences, quiet_hours_end: e.target.value })}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => saveMutation.mutate(preferences)}
          disabled={saveMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {saveMutation.isPending ? 'Speichern...' : 'Einstellungen speichern'}
        </Button>
      </div>
    </div>
  );
}