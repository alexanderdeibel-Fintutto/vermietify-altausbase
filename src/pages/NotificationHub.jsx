import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import AlertManager from '@/components/notifications/AlertManager';
import AlertPreferences from '@/components/notifications/AlertPreferences';

export default function NotificationHub() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Benachrichtigungen</h1>
        <p className="text-slate-600 text-sm mt-1">Verwaltung von Alerts und Benachrichtigungen</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="notifications">🔔 Center</TabsTrigger>
          <TabsTrigger value="alerts">⚠️ Alerts</TabsTrigger>
          <TabsTrigger value="preferences">⚙️ Einstellungen</TabsTrigger>
        </TabsList>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Benachrichtigungen</CardTitle>
            </CardHeader>
            <CardContent>
              <NotificationCenter />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Alert-Regeln</CardTitle>
            </CardHeader>
            <CardContent>
              <AlertManager />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Benachrichtigungseinstellungen</CardTitle>
            </CardHeader>
            <CardContent>
              <AlertPreferences />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}