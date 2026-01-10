import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Bell, Check, AlertCircle } from 'lucide-react';

export default function NotificationSettings() {
  const [successMessage, setSuccessMessage] = useState('');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: preferences = {} } = useQuery({
    queryKey: ['notification-preferences', user?.email],
    queryFn: async () => {
      if (!user?.email) return {};
      const result = await base44.asServiceRole.entities.UserPreferences.filter({
        user_email: user.email
      });
      return result[0] || {};
    },
    enabled: !!user?.email
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (preferences.id) {
        return base44.asServiceRole.entities.UserPreferences.update(preferences.id, data);
      } else {
        return base44.asServiceRole.entities.UserPreferences.create({
          user_email: user.email,
          ...data
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      setSuccessMessage('Einstellungen gespeichert');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  });

  const updatePreference = (key, value) => {
    const newPrefs = { ...preferences, [key]: value };
    saveMutation.mutate(newPrefs);
  };

  return (
    <div className="space-y-4">
      {successMessage && (
        <div className="p-3 bg-green-50 rounded-lg border border-green-200 flex items-center gap-2">
          <Check className="w-4 h-4 text-green-600" />
          <p className="text-sm text-green-700">{successMessage}</p>
        </div>
      )}

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Benachrichtigungen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Benachrichtigungen aktiviert</p>
              <p className="text-xs text-slate-600 mt-1">Alle Benachrichtigungen erhalten</p>
            </div>
            <Switch
              checked={preferences.notifications_enabled !== false}
              onCheckedChange={(value) => updatePreference('notifications_enabled', value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Benachrichtigungstypen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Aufgabenzuweisungen</p>
              <p className="text-xs text-slate-600 mt-1">Benachrichtigungen wenn mir Aufgaben zugewiesen werden</p>
            </div>
            <Switch
              checked={preferences.task_assignment_notifications !== false}
              onCheckedChange={(value) => updatePreference('task_assignment_notifications', value)}
            />
          </div>

          <div className="border-t pt-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Genehmigungen</p>
              <p className="text-xs text-slate-600 mt-1">Benachrichtigungen für ausstehende Genehmigungen</p>
            </div>
            <Switch
              checked={preferences.approval_notifications !== false}
              onCheckedChange={(value) => updatePreference('approval_notifications', value)}
            />
          </div>

          <div className="border-t pt-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Workflow-Status</p>
              <p className="text-xs text-slate-600 mt-1">Benachrichtigungen für Workflow-Statusänderungen</p>
            </div>
            <Switch
              checked={preferences.workflow_status_notifications !== false}
              onCheckedChange={(value) => updatePreference('workflow_status_notifications', value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Channels */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Benachrichtigungskanäle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-900 mb-3">Wo möchten Sie Benachrichtigungen erhalten?</p>
            <div className="space-y-2">
              {['in_app', 'slack'].map(channel => (
                <label key={channel} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(preferences.notification_channels || []).includes(channel)}
                    onChange={(e) => {
                      const channels = preferences.notification_channels || [];
                      if (e.target.checked) {
                        updatePreference('notification_channels', [...channels, channel]);
                      } else {
                        updatePreference('notification_channels', channels.filter(c => c !== channel));
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-slate-900">
                    {channel === 'in_app' ? 'In der App' : 'Slack'}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ruhige Stunden</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Ruhige Stunden aktivieren</p>
              <p className="text-xs text-slate-600 mt-1">Keine Benachrichtigungen zu bestimmten Zeiten</p>
            </div>
            <Switch
              checked={preferences.quiet_hours_enabled !== false}
              onCheckedChange={(value) => updatePreference('quiet_hours_enabled', value)}
            />
          </div>

          {preferences.quiet_hours_enabled && (
            <div className="border-t pt-4 space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-700">Von</label>
                <Input
                  type="time"
                  value={preferences.quiet_hours_start || '18:00'}
                  onChange={(e) => updatePreference('quiet_hours_start', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Bis</label>
                <Input
                  type="time"
                  value={preferences.quiet_hours_end || '09:00'}
                  onChange={(e) => updatePreference('quiet_hours_end', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}