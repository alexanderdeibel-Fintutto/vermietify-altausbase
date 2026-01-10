import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, ExternalLink, Code2, Slack, Database } from 'lucide-react';
import DocumentAIChatbot from '@/components/documents/DocumentAIChatbot';
import DocumentAnalyticsDashboard from '@/components/documents/DocumentAnalyticsDashboard';
import FinAPIDocumentSync from '@/components/documents/FinAPIDocumentSync';

export default function DocumentIntegrationHub() {
  const [copiedKey, setCopiedKey] = useState(null);
  const [apiKey, setApiKey] = useState('pk_' + Math.random().toString(36).substr(2, 24));

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: building } = useQuery({
    queryKey: ['building', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const buildings = await base44.asServiceRole.entities.Building.filter({
        created_by: user.email
      }, '-created_date', 1);
      return buildings[0];
    },
    enabled: !!user?.email
  });

  const companyId = building?.company_id || user?.company_id;

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const apiEndpoints = [
    {
      method: 'GET',
      path: '/api/v1/documents',
      description: 'Alle Dokumente abrufen',
      example: 'curl -H "X-API-Key: pk_..." https://api.example.com/api/v1/documents'
    },
    {
      method: 'POST',
      path: '/api/v1/documents',
      description: 'Neues Dokument erstellen',
      example: 'curl -X POST -H "X-API-Key: pk_..." -d \'{"name":"Doc"}\' https://api.example.com/api/v1/documents'
    },
    {
      method: 'POST',
      path: '/api/v1/documents/:id/workflows',
      description: 'Workflow starten',
      example: 'curl -X POST -H "X-API-Key: pk_..." -d \'{"workflow_id":"wf_123"}\' https://api.example.com/api/v1/documents/123/workflows'
    }
  ];

  if (!companyId) return <div className="text-center py-12">Lade Daten...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dokumenten Integration Hub</h1>
        <p className="text-slate-600 mt-1">FinAPI, Slack, AI-Chatbot, Analytics & Public API</p>
      </div>

      <Tabs defaultValue="integrations" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="integrations">Integrationen</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="chatbot">AI-Chat</TabsTrigger>
          <TabsTrigger value="api">Public API</TabsTrigger>
        </TabsList>

        {/* Integrations */}
        <TabsContent value="integrations" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* FinAPI */}
            <FinAPIDocumentSync companyId={companyId} />

            {/* Slack */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Slack className="w-4 h-4" />
                  Slack-Integration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-slate-700">
                  Dokumenten-Updates direkt in Slack-Kanälen
                </p>
                <Button className="w-full">
                  <Slack className="w-4 h-4 mr-2" />
                  Mit Slack verbinden
                </Button>
                <Badge variant="outline" className="w-full justify-center">
                  Autorisiert ✓
                </Badge>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics">
          <DocumentAnalyticsDashboard companyId={companyId} />
        </TabsContent>

        {/* Chatbot */}
        <TabsContent value="chatbot">
          <DocumentAIChatbot companyId={companyId} />
        </TabsContent>

        {/* Public API */}
        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Code2 className="w-4 h-4" />
                Public Document API
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* API Key */}
              <div>
                <label className="text-sm font-medium">API Key</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    value={apiKey}
                    readOnly
                    className="flex-1 p-2 bg-slate-100 rounded text-sm font-mono"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(apiKey, 'key')}
                  >
                    {copiedKey === 'key' ? '✓' : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Nutze diesen Key in der X-API-Key Header
                </p>
              </div>

              {/* Endpoints */}
              <div>
                <label className="text-sm font-medium mb-2 block">Endpoints</label>
                <div className="space-y-2">
                  {apiEndpoints.map((endpoint, i) => (
                    <Card key={i} className="bg-slate-50">
                      <CardContent className="pt-3">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <Badge variant="outline" className="text-xs">
                              {endpoint.method}
                            </Badge>
                            <p className="text-xs font-mono text-slate-700 mt-1">
                              {endpoint.path}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 mb-2">{endpoint.description}</p>
                        <details className="text-xs">
                          <summary className="cursor-pointer font-mono text-blue-600">
                            Beispiel
                          </summary>
                          <pre className="mt-2 p-2 bg-slate-800 text-slate-100 rounded overflow-x-auto text-[10px]">
                            {endpoint.example}
                          </pre>
                        </details>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Documentation */}
              <Button variant="outline" className="w-full gap-2">
                <ExternalLink className="w-4 h-4" />
                Vollständige Dokumentation
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}