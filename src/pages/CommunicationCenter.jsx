import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, MessageSquare, Phone, Send } from 'lucide-react';

export default function CommunicationCenterPage() {
  const messages = [
    { id: 1, from: 'Klaus Meyer', type: 'email', subject: 'Reparaturanfrage', date: 'Heute 10:30', unread: true },
    { id: 2, from: 'Jane Smith', type: 'sms', subject: 'Zahlungsbestätigung', date: 'Heute 09:15', unread: false },
    { id: 3, from: 'Bob Wilson', type: 'email', subject: 'Mietvertragsfrage', date: 'Gestern 16:45', unread: false },
  ];

  const templates = [
    { name: 'Mieterhöhung Ankündigung', type: 'Email' },
    { name: 'Reparaturauftrag', type: 'SMS' },
    { name: 'Zahlung überfällig', type: 'Email' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">💬 Communication Center</h1>
        <p className="text-slate-600 mt-1">Verwaltung aller Kommunikationen mit Mietern</p>
      </div>

      <Tabs defaultValue="inbox">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="inbox" className="flex items-center gap-2"><Mail className="w-4 h-4" /> Posteingang</TabsTrigger>
          <TabsTrigger value="compose" className="flex items-center gap-2"><Send className="w-4 h-4" /> Schreiben</TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2"><FileText className="w-4 h-4" /> Vorlagen</TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="space-y-3">
          {messages.map((msg) => (
            <Card key={msg.id} className={msg.unread ? 'border-blue-300 bg-blue-50' : 'border-slate-200'}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {msg.type === 'email' ? <Mail className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{msg.subject}</p>
                      <p className="text-sm text-slate-600">{msg.from} • {msg.date}</p>
                    </div>
                  </div>
                  {msg.unread && <Badge className="bg-blue-600">Neu</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="compose">
          <Card className="border border-slate-200">
            <CardContent className="pt-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">An</label>
                <input type="text" placeholder="Empfänger" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Betreff</label>
                <input type="text" placeholder="Betreff" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Nachricht</label>
                <textarea placeholder="Nachricht" rows="6" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"></textarea>
              </div>
              <div className="flex gap-2">
                <Button className="bg-blue-600 hover:bg-blue-700"><Send className="w-4 h-4 mr-2" />Senden</Button>
                <Button variant="outline">Speichern</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-3">
          {templates.map((template, idx) => (
            <Card key={idx} className="border border-slate-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{template.name}</p>
                    <p className="text-sm text-slate-600">{template.type}</p>
                  </div>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">Nutzen</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}