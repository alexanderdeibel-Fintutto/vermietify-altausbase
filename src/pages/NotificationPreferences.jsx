import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Clock, Volume2, Eye } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function NotificationPreferences() {
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const queryClient = useQueryClient();

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: false,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
  });

  const handleSave = async () => {
    try {
      await base44.auth.updateMe(preferences);
      alert('Einstellungen gespeichert!');
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-light text-slate-900">Benachrichtigungs-Präferenzen</h1>
        <p className="text-slate-600 font-light mt-2">
          Personalisieren Sie Ihre Benachrichtigungseinstellungen
        </p>
      </div>

      <Tabs defaultValue="channels" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="channels">Kanäle</TabsTrigger>
          <TabsTrigger value="quiet-hours">Ruhezeiten</TabsTrigger>
          <TabsTrigger value="types">Benachrichtigungstypen</TabsTrigger>
        </TabsList>

        {/* Kanäle */}
        <TabsContent value="channels" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Volume2 className="w-5 h-5" />
                Benachrichtigungskanäle
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'emailNotifications', label: 'E-Mail-Benachrichtigungen', desc: 'Empfangen Sie Benachrichtigungen per E-Mail' },
                { key: 'pushNotifications', label: 'Push-Benachrichtigungen', desc: 'Empfangen Sie Browser-Benachrichtigungen' },
              ].map(item => (
                <label key={item.key} className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={preferences[item.key]}
                    onChange={(e) => setPreferences({ ...preferences, [item.key]: e.target.checked })}
                    className="mt-1 rounded"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.label}</p>
                    <p className="text-xs text-slate-600">{item.desc}</p>
                  </div>
                </label>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ruhezeiten */}
        <TabsContent value="quiet-hours" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="w-5 h-5" />
                Ruhezeiten
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={preferences.quietHoursEnabled}
                  onChange={(e) => setPreferences({ ...preferences, quietHoursEnabled: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm font-medium">Ruhezeiten aktivieren</span>
              </label>

              {preferences.quietHoursEnabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-2">Von</label>
                    <input
                      type="time"
                      value={preferences.quietHoursStart}
                      onChange={(e) => setPreferences({ ...preferences, quietHoursStart: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-2">Bis</label>
                    <input
                      type="time"
                      value={preferences.quietHoursEnd}
                      onChange={(e) => setPreferences({ ...preferences, quietHoursEnd: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Benachrichtigungstypen */}
        <TabsContent value="types" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Eye className="w-5 h-5" />
                Benachrichtigungstypen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                'Zahlungserinnerungen',
                'Wartungsarbeiten',
                'Ankündigungen',
                'Vertrag-Updates',
                'Rechnungen',
              ].map(type => (
                <label key={type} className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">{type}</span>
                </label>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-700">
        Einstellungen speichern
      </Button>
    </div>
  );
}