import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import APIKeyManager from '@/components/api/APIKeyManager';
import WebhookManager from '@/components/integrations/WebhookManager';
import SlackNotifications from '@/components/integrations/SlackNotifications';
import GoogleDriveSync from '@/components/integrations/GoogleDriveSync';

export default function IntegrationHub() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Integration Hub</h1>
        <p className="text-slate-600 text-sm mt-1">API, Webhooks & externe Services verwalten</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="api" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="api">🔑 API Keys</TabsTrigger>
          <TabsTrigger value="webhooks">🪝 Webhooks</TabsTrigger>
          <TabsTrigger value="slack">💬 Slack</TabsTrigger>
          <TabsTrigger value="drive">🔗 Google Drive</TabsTrigger>
        </TabsList>

        {/* API Keys */}
        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>API Access</CardTitle>
              <CardDescription>Erstellen und verwalten Sie API-Schlüssel für externe Integrationen</CardDescription>
            </CardHeader>
            <CardContent>
              <APIKeyManager />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhooks */}
        <TabsContent value="webhooks">
          <Card>
            <CardHeader>
              <CardTitle>Webhooks</CardTitle>
              <CardDescription>Empfangen Sie Echtzeit-Benachrichtigungen bei Ereignissen</CardDescription>
            </CardHeader>
            <CardContent>
              <WebhookManager />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Slack */}
        <TabsContent value="slack">
          <Card>
            <CardHeader>
              <CardTitle>Slack Integration</CardTitle>
              <CardDescription>Erhalten Sie Benachrichtigungen in Slack</CardDescription>
            </CardHeader>
            <CardContent>
              <SlackNotifications />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Google Drive */}
        <TabsContent value="drive">
          <Card>
            <CardHeader>
              <CardTitle>Google Drive Sync</CardTitle>
              <CardDescription>Synchronisieren Sie Dokumente mit Google Drive</CardDescription>
            </CardHeader>
            <CardContent>
              <GoogleDriveSync />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}