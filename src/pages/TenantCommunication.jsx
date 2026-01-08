import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Send, Clock, CheckCircle } from 'lucide-react';

export default function TenantCommunicationPage() {
  const conversations = [
    { id: 1, tenant: 'Klaus Meyer', lastMsg: 'Reparaturanfrage', status: 'open', unread: 2, updated: 'Heute 14:30' },
    { id: 2, tenant: 'Jane Smith', lastMsg: 'Danke für die schnelle Lösung', status: 'resolved', unread: 0, updated: 'Heute 10:15' },
    { id: 3, tenant: 'Bob Wilson', lastMsg: 'Wann ist die nächste Inspektion?', status: 'open', unread: 1, updated: 'Gestern 16:45' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">💬 Mieter-Kommunikation</h1>
        <p className="text-slate-600 mt-1">Direkte Kommunikation mit Ihren Mietern</p>
      </div>

      <Tabs defaultValue="conversations">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="conversations">Gespräche</TabsTrigger>
          <TabsTrigger value="broadcast">Rundfunk</TabsTrigger>
          <TabsTrigger value="surveys">Umfragen</TabsTrigger>
        </TabsList>

        <TabsContent value="conversations" className="space-y-3">
          {conversations.map((conv) => (
            <Card key={conv.id} className={conv.unread > 0 ? 'border-blue-300 bg-blue-50' : 'border-slate-200'}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <MessageCircle className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-slate-900">{conv.tenant}</h3>
                      <Badge className={conv.status === 'open' ? 'bg-blue-600' : 'bg-green-600'}>
                        {conv.status === 'open' ? 'Offen' : '✓ Gelöst'}
                      </Badge>
                      {conv.unread > 0 && <Badge className="bg-red-600">{conv.unread}</Badge>}
                    </div>
                    <p className="text-sm text-slate-600">{conv.lastMsg} • {conv.updated}</p>
                  </div>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700"><Send className="w-4 h-4 mr-1" />Antworten</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="broadcast">
          <Card className="border border-slate-200">
            <CardHeader>
              <CardTitle>Rundfunk-Nachricht senden</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Betreff</label>
                <input type="text" placeholder="z.B. Wartungsankündigung" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Nachricht</label>
                <textarea placeholder="Nachrichtentext" rows="6" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"></textarea>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Kanal</label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> Email</label>
                  <label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> SMS</label>
                  <label className="flex items-center gap-2"><input type="checkbox" /> Push-Notification</label>
                </div>
              </div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700"><Send className="w-4 h-4 mr-2" />Senden</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="surveys">
          <Card className="border border-slate-200">
            <CardHeader>
              <CardTitle>Umfragen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Card className="border border-slate-200">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-slate-900 mb-2">Zufriedenheit mit Service</h3>
                  <p className="text-xs text-slate-600 mb-3">Responses: 12/24</p>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-600" style={{ width: '50%' }}></div>
                  </div>
                </CardContent>
              </Card>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">Neue Umfrage erstellen</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}