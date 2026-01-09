import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, MessageCircle, Phone, Send } from 'lucide-react';
import QuickStats from '@/components/shared/QuickStats';
import ModuleGuard from '@/components/package/ModuleGuard';

export default function KommunikationPage() {
  const messages = [
    { id: 1, type: 'email', from: 'mieter@example.com', subject: 'Frage zur Miete', date: '2026-01-07', status: 'unread' },
    { id: 2, type: 'whatsapp', from: '+49 30 123456', message: 'Wann ist die Wartung?', date: '2026-01-07', status: 'read' },
    { id: 3, type: 'email', from: 'vermieter@example.com', subject: 'Reparaturauftrag', date: '2026-01-06', status: 'read' },
  ];

  const stats = [
    { label: 'Ungelesene', value: messages.filter(m => m.status === 'unread').length },
    { label: 'Heute gesendet', value: 12 },
    { label: 'Diese Woche', value: 87 },
    { label: 'Avg. Response', value: '2.5h' },
  ];

  const getTypeIcon = (type) => {
    switch(type) {
      case 'email': return <Mail className="w-5 h-5 text-blue-600" />;
      case 'whatsapp': return <MessageCircle className="w-5 h-5 text-green-600" />;
      case 'phone': return <Phone className="w-5 h-5 text-orange-600" />;
      default: return null;
    }
  };

  return (
    <ModuleGuard moduleName="kommunikation">
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-light text-slate-900">Kommunikation</h1>
        <p className="text-slate-600 mt-1">Zentrale Verwaltung aller Kommunikationskanäle</p>
      </div>

      <QuickStats stats={stats} accentColor="blue" />

      <Tabs defaultValue="messages">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="messages">📨 Nachrichten</TabsTrigger>
          <TabsTrigger value="templates">📋 Vorlagen</TabsTrigger>
          <TabsTrigger value="settings">⚙️ Einstellungen</TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="space-y-3">
          {messages.map((msg) => (
            <Card key={msg.id} className="border border-slate-200">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getTypeIcon(msg.type)}
                    <div>
                      <p className="font-semibold text-slate-900">{msg.from}</p>
                      <p className="text-sm text-slate-600">{msg.subject || msg.message}</p>
                      <p className="text-xs text-slate-500 mt-1">{msg.date}</p>
                    </div>
                  </div>
                  {msg.status === 'unread' && <Badge className="bg-blue-600">Neu</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <p className="text-slate-600">Verwalten Sie Kommunikationsvorlagen über die Email Templates Seite</p>
          <Button className="bg-blue-600 hover:bg-blue-700">Zu Email Templates</Button>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Kommunikationskanäle</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { name: 'Email', enabled: true },
                { name: 'WhatsApp', enabled: true },
                { name: 'SMS', enabled: false },
              ].map((channel, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                  <span className="font-semibold text-slate-900">{channel.name}</span>
                  <Badge className={channel.enabled ? 'bg-green-600' : 'bg-slate-600'}>
                    {channel.enabled ? 'Aktiv' : 'Inaktiv'}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </ModuleGuard>
  );
}