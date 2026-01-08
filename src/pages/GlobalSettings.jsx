import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toggle } from "@/components/ui/toggle";
import { Settings, Bell, Lock, Palette, FileText, Globe } from 'lucide-react';

export default function GlobalSettingsPage() {
  const [settings, setSettings] = useState({
    darkMode: false,
    emailNotifications: true,
    twoFA: true,
    autoBackup: true,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">⚙️ Globale Einstellungen</h1>
        <p className="text-slate-600 mt-1">System- und Account-Konfiguration</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="flex items-center gap-2"><Settings className="w-4 h-4" /> Allgemein</TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2"><Bell className="w-4 h-4" /> Benachrichtigungen</TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2"><Lock className="w-4 h-4" /> Sicherheit</TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2"><Palette className="w-4 h-4" /> Aussehen</TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2"><Globe className="w-4 h-4" /> Integrationen</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card className="border border-slate-200">
            <CardHeader><CardTitle>Sprache & Region</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Sprache</label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                  <option>Deutsch</option>
                  <option>English</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Zeitzone</label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                  <option>Europe/Berlin (UTC+1)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Datumsformat</label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                  <option>DD.MM.YYYY</option>
                  <option>MM/DD/YYYY</option>
                </select>
              </div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">Speichern</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card className="border border-slate-200">
            <CardHeader><CardTitle>Benachrichtigungseinstellungen</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">Email-Benachrichtigungen</p>
                  <p className="text-sm text-slate-600">Wichtige Updates per Email erhalten</p>
                </div>
                <Toggle pressed={settings.emailNotifications} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">System-Updates</p>
                  <p className="text-sm text-slate-600">Benachrichtigungen über neue Features</p>
                </div>
                <Toggle pressed={true} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">Wöchentliche Reports</p>
                  <p className="text-sm text-slate-600">Zusammenfassungen per Email</p>
                </div>
                <Toggle pressed={true} />
              </div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">Speichern</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card className="border border-slate-200">
            <CardHeader><CardTitle>Sicherheit</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">Zwei-Faktor-Authentifizierung</p>
                  <p className="text-sm text-slate-600">Erhöhte Kontosicherheit</p>
                </div>
                <Toggle pressed={settings.twoFA} />
              </div>
              <Button variant="outline" className="w-full">Passwort ändern</Button>
              <Button variant="outline" className="w-full">Aktive Sessions verwalten</Button>
              <Button variant="outline" className="w-full">API-Schlüssel verwalten</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <Card className="border border-slate-200">
            <CardHeader><CardTitle>Themeinstellungen</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">Dark Mode</p>
                  <p className="text-sm text-slate-600">Dunkles Farbschema verwenden</p>
                </div>
                <Toggle pressed={settings.darkMode} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Akzentfarbe</label>
                <div className="flex gap-2">
                  {['emerald', 'blue', 'purple', 'orange'].map(color => (
                    <div key={color} className={`w-8 h-8 rounded-lg cursor-pointer bg-${color}-600`}></div>
                  ))}
                </div>
              </div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">Speichern</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <Card className="border border-slate-200">
            <CardHeader><CardTitle>Verbundene Dienste</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {['Google Drive', 'Slack', 'Dropbox'].map((service, idx) => (
                <div key={idx} className="p-3 border border-slate-200 rounded-lg flex items-center justify-between">
                  <span className="font-semibold text-slate-900">{service}</span>
                  <Button size="sm" variant="outline">Verbinden</Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}