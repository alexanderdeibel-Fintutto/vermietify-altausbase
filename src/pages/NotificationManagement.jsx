import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Mail, MessageSquare, Smartphone } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function NotificationManagement() {
  const [selectedChannel, setSelectedChannel] = useState('email');

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isAdmin = currentUser?.role === 'admin';

  const channels = [
    { id: 'email', label: 'E-Mail', icon: Mail },
    { id: 'sms', label: 'SMS', icon: MessageSquare },
    { id: 'push', label: 'Push', icon: Smartphone },
    { id: 'inapp', label: 'In-App', icon: Bell },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-light text-slate-900">Benachrichtigungsverwaltung</h1>
        <p className="text-slate-600 font-light mt-2">
          {isAdmin ? 'Verwalten Sie Benachrichtigungskanäle und Einstellungen' : 'Ihre Benachrichtigungseinstellungen'}
        </p>
      </div>

      {isAdmin && (
        <Tabs defaultValue="channels" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="channels">Kanäle</TabsTrigger>
            <TabsTrigger value="templates">Vorlagen</TabsTrigger>
          </TabsList>

          {/* Kanäle */}
          <TabsContent value="channels" className="mt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {channels.map(channel => {
                const Icon = channel.icon;
                return (
                  <Card key={channel.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Icon className="w-5 h-5" />
                        {channel.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" defaultChecked className="rounded" />
                          <span className="text-sm">Aktiviert</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" defaultChecked className="rounded" />
                          <span className="text-sm">Für Mieter sichtbar</span>
                        </label>
                      </div>
                      <Button size="sm" variant="outline" className="w-full">
                        Konfigurieren
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Vorlagen */}
          <TabsContent value="templates" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Benachrichtigungsvorlagen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['Zahlungserinnerung', 'Wartung', 'Ankündigung', 'Notfall'].map(template => (
                    <Card key={template} className="bg-slate-50">
                      <CardContent className="pt-6">
                        <h3 className="font-medium text-sm mb-3">{template}</h3>
                        <Button size="sm" variant="outline" className="w-full">
                          Bearbeiten
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {!isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Ihre Benachrichtigungseinstellungen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {channels.map(channel => {
              const Icon = channel.icon;
              return (
                <div key={channel.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{channel.label}</span>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}