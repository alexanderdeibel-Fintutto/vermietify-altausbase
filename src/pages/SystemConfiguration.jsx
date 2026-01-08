import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, SaveIcon, RotateCcw } from 'lucide-react';

export default function SystemConfigurationPage() {
  const [settings, setSettings] = useState({
    timezone: 'Europe/Berlin',
    language: 'de',
    currency: 'EUR',
    dateFormat: 'DD.MM.YYYY',
  });

  const configSections = [
    { title: 'System', items: ['Zeitzone', 'Sprache', 'Währung', 'Datumsformat'] },
    { title: 'Sicherheit', items: ['2-Faktor-Auth erzwingen', 'Session Timeout', 'IP-Whitelist', 'API-Ratenlimit'] },
    { title: 'Email', items: ['SMTP-Server', 'From-Adresse', 'Vorlagen', 'Archivierung'] },
    { title: 'Backup', items: ['Häufigkeit', 'Aufbewahrung', 'Automatisches Backup', 'Cloud-Speicher'] },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">⚙️ Systemkonfiguration</h1>
          <p className="text-slate-600 mt-1">Globale Systemeinstellungen verwalten</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><RotateCcw className="w-4 h-4 mr-2" />Zurücksetzen</Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700"><SaveIcon className="w-4 h-4 mr-2" />Speichern</Button>
        </div>
      </div>

      <Tabs defaultValue="system">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="security">Sicherheit</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
        </TabsList>

        <TabsContent value="system" className="space-y-4">
          {['Zeitzone', 'Sprache', 'Währung', 'Datumsformat'].map((item, idx) => (
            <Card key={idx} className="border border-slate-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-900">{item}</label>
                  <select className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
                    <option>Option 1</option>
                    <option>Option 2</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          {['2-Faktor-Auth erzwingen', 'Session Timeout', 'IP-Whitelist', 'API-Ratenlimit'].map((item, idx) => (
            <Card key={idx} className="border border-slate-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-900">{item}</label>
                  <Badge className="bg-blue-600">Aktiviert</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          {['SMTP-Server', 'From-Adresse', 'Vorlagen', 'Archivierung'].map((item, idx) => (
            <Card key={idx} className="border border-slate-200">
              <CardContent className="pt-6">
                <label className="block font-semibold text-slate-900 mb-2">{item}</label>
                <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder={item} />
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="backup" className="space-y-4">
          {['Täglich', 'Wöchentlich', 'Monatlich'].map((freq, idx) => (
            <Card key={idx} className="border border-slate-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-900">Backup-Häufigkeit: {freq}</label>
                  <input type="radio" name="backup-freq" defaultChecked={freq === 'Täglich'} />
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}