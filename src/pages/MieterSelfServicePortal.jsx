import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, MessageSquare, Wrench, DollarSign, Lock } from 'lucide-react';

export default function MieterSelfServicePortalPage() {
  const mieterDaten = {
    name: 'Klaus Meyer',
    email: 'klaus.meyer@example.com',
    wohnung: 'Wohnung 2B',
    mietbeginn: '01.03.2020',
    miete: '€1.450/Monat'
  };

  const dokumente = [
    { name: 'Mietvertrag', date: '01.03.2020' },
    { name: 'Nebenkosten 2025', date: '15.01.2026' },
    { name: 'Betriebskostenabrechnung 2024', date: '10.12.2025' },
  ];

  const anfragen = [
    { id: 1, titel: 'Reparaturanfrage', status: 'offen', datum: '08.01.2026' },
    { id: 2, titel: 'Frage zur Miete', status: 'beantwortet', datum: '05.01.2026' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">👤 Mieter-Selbstservice Portal</h1>
        <p className="text-slate-600 mt-1">Willkommen, {mieterDaten.name}</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card className="border border-slate-200">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-slate-600 mb-1">Aktuelle Miete</p>
            <p className="text-2xl font-bold text-slate-900">{mieterDaten.miete}</p>
          </CardContent>
        </Card>
        <Card className="border border-slate-200">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-slate-600 mb-1">Offene Anfragen</p>
            <p className="text-2xl font-bold text-red-600">1</p>
          </CardContent>
        </Card>
        <Card className="border border-slate-200">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-slate-600 mb-1">Dokumente</p>
            <p className="text-2xl font-bold text-slate-900">{dokumente.length}</p>
          </CardContent>
        </Card>
        <Card className="border border-slate-200">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-slate-600 mb-1">Wohnung</p>
            <p className="text-lg font-bold text-slate-900">{mieterDaten.wohnung}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="dokumente">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dokumente" className="flex items-center gap-2"><FileText className="w-4 h-4" /> Dokumente</TabsTrigger>
          <TabsTrigger value="anfragen" className="flex items-center gap-2"><Wrench className="w-4 h-4" /> Anfragen</TabsTrigger>
          <TabsTrigger value="nachrichten" className="flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Nachrichten</TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2"><Lock className="w-4 h-4" /> Einstellungen</TabsTrigger>
        </TabsList>

        <TabsContent value="dokumente" className="space-y-2">
          {dokumente.map((doc, idx) => (
            <Card key={idx} className="border border-slate-200">
              <CardContent className="pt-6 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{doc.name}</p>
                  <p className="text-xs text-slate-600">{doc.date}</p>
                </div>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">Download</Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="anfragen" className="space-y-2">
          {anfragen.map((anfrage) => (
            <Card key={anfrage.id} className="border border-slate-200">
              <CardContent className="pt-6 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{anfrage.titel}</p>
                  <p className="text-xs text-slate-600">{anfrage.datum}</p>
                </div>
                <Badge className={anfrage.status === 'offen' ? 'bg-orange-600' : 'bg-green-600'}>
                  {anfrage.status.toUpperCase()}
                </Badge>
              </CardContent>
            </Card>
          ))}
          <Button className="w-full bg-emerald-600 hover:bg-emerald-700">Neue Anfrage</Button>
        </TabsContent>

        <TabsContent value="nachrichten">
          <Card className="border border-slate-200">
            <CardContent className="pt-6">
              <p className="text-slate-600 text-center">Keine neuen Nachrichten</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card className="border border-slate-200">
            <CardContent className="pt-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Email-Benachrichtigungen</label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked /> Wichtige Updates
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked /> Reparaturanfragen
                </label>
              </div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">Speichern</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}