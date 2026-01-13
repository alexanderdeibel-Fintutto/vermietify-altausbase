import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle2, Link2, Zap } from 'lucide-react';
import APIKeyManager from '@/components/api/APIKeyManager';
import WebhookManager from '@/components/api/WebhookManager';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const INTEGRATIONS = [
  {
    name: 'Slack',
    icon: '🔔',
    description: 'Notifications & Messages',
    connected: true,
    scopes: ['chat:write', 'users:read']
  },
  {
    name: 'Google Drive',
    icon: '📁',
    description: 'Document Management',
    connected: false,
    scopes: ['drive.file']
  },
  {
    name: 'Stripe',
    icon: '💳',
    description: 'Payment Processing',
    connected: false,
    scopes: ['payments']
  }
];

export default function IntegrationHub() {
  const { data: config } = useQuery({
    queryKey: ['integration-config'],
    queryFn: async () => {
      return {
        apiBase: window.location.origin + '/api'
      };
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Integrations & API</h1>
        <p className="text-slate-600 text-sm mt-1">API, Webhooks, externe Services</p>
      </div>

      {/* Integrations Overview */}
      <div>
        <h2 className="text-lg font-bold mb-3">Verfügbare Integrationen</h2>
        <div className="grid grid-cols-3 gap-4">
          {INTEGRATIONS.map(integration => (
            <Card key={integration.name} className={integration.connected ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200'}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <span className="text-3xl">{integration.icon}</span>
                  {integration.connected ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">{integration.name}</p>
                  <p className="text-xs text-slate-600">{integration.description}</p>
                </div>
                <Button
                  size="sm"
                  variant={integration.connected ? 'outline' : 'default'}
                  className="w-full"
                >
                  {integration.connected ? '✓ Verbunden' : 'Verbinden'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="api" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="api">🔑 API Keys</TabsTrigger>
          <TabsTrigger value="webhooks">🪝 Webhooks</TabsTrigger>
          <TabsTrigger value="docs">📚 Dokumentation</TabsTrigger>
        </TabsList>

        {/* API Keys Tab */}
        <TabsContent value="api">
          <div className="space-y-4">
            <APIKeyManager />
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-sm">API Endpoint</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <code className="block p-3 bg-white rounded border font-mono text-xs break-all">
                  {config?.apiBase || 'https://api.example.com'}
                </code>
                <p className="text-xs text-slate-600">
                  Verwende deine API Key mit dem Header: <code>Authorization: Bearer sk_xxx</code>
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks">
          <div className="space-y-4">
            <WebhookManager />
            <Card className="border-purple-200 bg-purple-50">
              <CardHeader>
                <CardTitle className="text-sm">Webhook Testing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-600 mb-3">
                  Jeder Webhook wird mit Event-Daten im JSON-Format gesendet.
                </p>
                <pre className="text-xs bg-white p-3 rounded border overflow-auto max-h-40">
{`{
  "event": "invoice.created",
  "timestamp": "2026-01-13T10:30:00Z",
  "data": {
    "id": "inv_123",
    "number": "INV-001",
    "amount": 450.00
  }
}`}
                </pre>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Documentation Tab */}
        <TabsContent value="docs">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">API Dokumentation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium text-sm mb-2">REST Endpoints</h3>
                <div className="space-y-2 text-xs font-mono bg-slate-50 p-3 rounded">
                  <div>GET /api/invoices - Liste aller Rechnungen</div>
                  <div>GET /api/invoices/{'{id}'} - Rechnung abrufen</div>
                  <div>POST /api/invoices - Neue Rechnung erstellen</div>
                  <div>PUT /api/invoices/{'{id}'} - Rechnung aktualisieren</div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-sm mb-2">Authentifizierung</h3>
                <p className="text-xs text-slate-600">
                  Alle Requests müssen einen gültigen API Key im Authorization-Header enthalten.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-sm mb-2">Rate Limits</h3>
                <p className="text-xs text-slate-600">
                  100 Requests pro Minute pro API Key
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}