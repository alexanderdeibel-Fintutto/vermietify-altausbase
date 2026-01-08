import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Phone, Calendar, Shield, Activity, Settings } from 'lucide-react';

export default function UserDetailPage() {
  const [user] = useState({
    id: 'user-001',
    name: 'Klaus Meyer',
    email: 'klaus.meyer@example.com',
    phone: '+49 30 123456',
    role: 'admin',
    joinDate: '2025-06-15',
    lastLogin: '2026-01-08 14:23',
    avatar: '👨‍💼',
  });

  const activities = [
    { type: 'login', description: 'Angemeldet', time: 'Heute 14:23' },
    { type: 'create', description: 'Neues Gebäude erstellt', time: 'Heute 10:45' },
    { type: 'update', description: 'Mieterdetails aktualisiert', time: 'Gestern 16:30' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="text-5xl">{user.avatar}</div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{user.name}</h1>
          <Badge className="mt-2 bg-blue-600">{user.role === 'admin' ? '👑 Admin' : '👤 User'}</Badge>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="activity">Aktivität</TabsTrigger>
          <TabsTrigger value="settings">Einstellungen</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card className="border border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Mail className="w-5 h-5" /> Email</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-900">{user.email}</p>
              </CardContent>
            </Card>

            <Card className="border border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Phone className="w-5 h-5" /> Telefon</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-900">{user.phone}</p>
              </CardContent>
            </Card>

            <Card className="border border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5" /> Beigetreten</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-900">15. Juni 2025</p>
              </CardContent>
            </Card>

            <Card className="border border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5" /> Letzter Login</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-900">Heute 14:23 Uhr</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5" /> Berechtigungen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {['Alle Gebäude verwalten', 'Benutzer verwalten', 'Reports exportieren', 'Systemeinstellungen'].map((perm, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="w-4 h-4" />
                    <span className="text-sm text-slate-700">{perm}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-3">
          {activities.map((activity, idx) => (
            <Card key={idx} className="border border-slate-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{activity.description}</p>
                    <p className="text-sm text-slate-600">{activity.time}</p>
                  </div>
                  <Activity className="w-5 h-5 text-slate-400" />
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="settings">
          <Card className="border border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Settings className="w-5 h-5" /> Benutzereinstellungen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full justify-start">🔑 Passwort ändern</Button>
              <Button variant="outline" className="w-full justify-start">🔐 Zwei-Faktor-Authentifizierung</Button>
              <Button variant="outline" className="w-full justify-start">📧 Email-Benachrichtigungen</Button>
              <Button variant="destructive" className="w-full justify-start">🗑️ Account löschen</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}