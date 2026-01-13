import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const CATEGORIES = ['invoice', 'contract', 'payment', 'document', 'system'];

export default function AlertPreferences() {
  const [preferences, setPreferences] = useState({
    enabled_channels: { 'in-app': true, 'email': true, 'sms': false, 'push': true },
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00',
    batch_enabled: true,
    batch_frequency: 'daily'
  });
  const queryClient = useQueryClient();

  const { data: savedPrefs } = useQuery({
    queryKey: ['alert-preferences'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const prefs = await base44.entities.AlertPreference?.list?.();
      return prefs?.find(p => p.user_email === user.email);
    }
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      if (savedPrefs?.id) {
        await base44.entities.AlertPreference?.update?.(savedPrefs.id, {
          enabled_channels: JSON.stringify(preferences.enabled_channels),
          quiet_hours_start: preferences.quiet_hours_start,
          quiet_hours_end: preferences.quiet_hours_end,
          batch_enabled: preferences.batch_enabled,
          batch_frequency: preferences.batch_frequency
        });
      } else {
        await base44.entities.AlertPreference?.create?.({
          user_email: user.email,
          enabled_channels: JSON.stringify(preferences.enabled_channels),
          quiet_hours_start: preferences.quiet_hours_start,
          quiet_hours_end: preferences.quiet_hours_end,
          batch_enabled: preferences.batch_enabled,
          batch_frequency: preferences.batch_frequency
        });
      }
    },
    onSuccess: () => {
      toast.success('✅ Einstellungen gespeichert');
      queryClient.invalidateQueries(['alert-preferences']);
    }
  });

  return (
    <div className="space-y-4">
      {/* Channels */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Benachrichtigungskanäle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.keys(preferences.enabled_channels).map(channel => (
            <label key={channel} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={preferences.enabled_channels[channel]}
                onCheckedChange={(checked) => {
                  setPreferences({
                    ...preferences,
                    enabled_channels: {
                      ...preferences.enabled_channels,
                      [channel]: checked
                    }
                  });
                }}
              />
              <span className="text-sm capitalize">
                {channel === 'in-app' ? 'In-App' : channel === 'sms' ? 'SMS' : channel === 'push' ? 'Push' : 'Email'}
              </span>
            </label>
          ))}
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Stille Stunden</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium">Von</label>
              <Input
                type="time"
                value={preferences.quiet_hours_start}
                onChange={(e) => setPreferences({ ...preferences, quiet_hours_start: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium">Bis</label>
              <Input
                type="time"
                value={preferences.quiet_hours_end}
                onChange={(e) => setPreferences({ ...preferences, quiet_hours_end: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Batch Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Email-Sammlung</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={preferences.batch_enabled}
              onCheckedChange={(checked) => setPreferences({ ...preferences, batch_enabled: checked })}
            />
            <span className="text-sm">Mehrere Benachrichtigungen zusammenfassen</span>
          </label>
          {preferences.batch_enabled && (
            <Select value={preferences.batch_frequency} onValueChange={(v) => setPreferences({ ...preferences, batch_frequency: v })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Täglich</SelectItem>
                <SelectItem value="weekly">Wöchentlich</SelectItem>
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      <Button
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
        className="w-full"
      >
        Speichern
      </Button>
    </div>
  );
}