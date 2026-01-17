import React from 'react';
import PageHeader from '@/components/shared/PageHeader';
import WebhookManager from '@/components/integrations/WebhookManager';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plug, CheckCircle } from 'lucide-react';

export default function IntegrationHub() {
  const integrations = [
    { name: 'Slack', status: 'connected', description: 'Team-Kommunikation' },
    { name: 'FinAPI', status: 'connected', description: 'Banking-Daten' },
    { name: 'Google Drive', status: 'disconnected', description: 'Dokumente' }
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Integrationen"
        subtitle="Verbinden Sie externe Dienste"
      />

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plug className="h-5 w-5" />
              Verfügbare Integrationen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {integrations.map((integration) => (
                <div key={integration.name} className="flex items-center justify-between p-4 bg-[var(--theme-surface)] rounded-lg">
                  <div className="flex items-center gap-3">
                    {integration.status === 'connected' && (
                      <CheckCircle className="h-5 w-5 text-[var(--vf-success-500)]" />
                    )}
                    <div>
                      <div className="font-semibold">{integration.name}</div>
                      <div className="text-xs text-[var(--theme-text-muted)]">{integration.description}</div>
                    </div>
                  </div>
                  <Button variant={integration.status === 'connected' ? 'outline' : 'gradient'}>
                    {integration.status === 'connected' ? 'Trennen' : 'Verbinden'}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <WebhookManager />
      </div>
    </div>
  );
}