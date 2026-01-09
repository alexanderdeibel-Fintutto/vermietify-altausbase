import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Settings, Shield, Database, AlertTriangle } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <AdminLayout currentPageName="AdminSettings">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-light tracking-tight">⚙️ ADMIN SETTINGS</h2>
          <p className="text-slate-500 text-sm mt-2">Systemweite Konfiguration und Verwaltung</p>
        </div>

        {/* Warning */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-900">Admin-Bereich</p>
            <p className="text-xs text-red-700">Änderungen hier beeinflussen das gesamte System. Bitte mit Vorsicht vorgehen.</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-slate-100">
            <TabsTrigger value="general" className="gap-2">
              <Settings className="w-4 h-4" />
              ALLGEMEIN
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="w-4 h-4" />
              SICHERHEIT
            </TabsTrigger>
            <TabsTrigger value="database" className="gap-2">
              <Database className="w-4 h-4" />
              DATENBANK
            </TabsTrigger>
          </TabsList>

          {/* ALLGEMEIN */}
          <TabsContent value="general" className="space-y-4 mt-6">
            <Card className="font-mono text-sm">
              <CardHeader>
                <CardTitle className="font-mono text-base">APP PROPERTIES</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">APP NAME</label>
                  <Input defaultValue="FinX Immoverwaltung" className="font-mono text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">VERSION</label>
                  <Input defaultValue="1.0.0" className="font-mono text-xs" disabled />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">ENVIRONMENT</label>
                  <div className="flex items-center gap-2">
                    <Input defaultValue="PRODUCTION" className="font-mono text-xs" disabled />
                    <Badge className="bg-green-100 text-green-800">LIVE</Badge>
                  </div>
                </div>
                <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white">SAVE CHANGES</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SICHERHEIT */}
          <TabsContent value="security" className="space-y-4 mt-6">
            <Card className="font-mono text-sm">
              <CardHeader>
                <CardTitle className="font-mono text-base">SECURITY SETTINGS</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-2">2FA ENFORCEMENT</label>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">ENABLED</Button>
                    <span className="text-xs text-slate-600">Für alle Admin-Benutzer erforderlich</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-2">SESSION TIMEOUT</label>
                  <div className="flex gap-2 items-center">
                    <Input defaultValue="30" type="number" className="font-mono text-xs w-20" />
                    <span className="text-xs text-slate-600">Minuten</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-2">API KEY ROTATION</label>
                  <div className="text-xs text-slate-600 mb-2">Letzte Rotation: 7 Tage</div>
                  <Button size="sm" variant="outline">ROTATE NOW</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* DATENBANK */}
          <TabsContent value="database" className="space-y-4 mt-6">
            <Card className="font-mono text-sm">
              <CardHeader>
                <CardTitle className="font-mono text-base">DATABASE STATUS</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded">
                    <p className="text-xs text-slate-600 mb-1">TOTAL RECORDS</p>
                    <p className="text-xl font-light">12,847</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded">
                    <p className="text-xs text-slate-600 mb-1">DB SIZE</p>
                    <p className="text-xl font-light">2.3 GB</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-700 mb-2">MAINTENANCE</p>
                  <Button size="sm" variant="outline" className="w-full">RUN BACKUP NOW</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}