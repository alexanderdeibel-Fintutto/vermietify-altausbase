import React from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plug, CheckCircle } from 'lucide-react';

export default function IntegrationHub() {
  const integrations = [
    { name: 'Stripe', description: 'Zahlungen verarbeiten', connected: true, icon: '💳' },
    { name: 'Slack', description: 'Team-Benachrichtigungen', connected: true, icon: '💬' },
    { name: 'Google Drive', description: 'Dokumente synchronisieren', connected: false, icon: '📁' },
    { name: 'DATEV', description: 'Buchhaltung exportieren', connected: false, icon: '📊' }
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Integrationen"
        subtitle="Verbinden Sie externe Dienste"
      />

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        {integrations.map((integration, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <span className="text-3xl">{integration.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    {integration.name}
                    {integration.connected && (
                      <CheckCircle className="h-4 w-4 text-[var(--vf-success-500)]" />
                    )}
                  </div>
                  <div className="text-sm font-normal text-[var(--theme-text-secondary)]">
                    {integration.description}
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                variant={integration.connected ? 'outline' : 'gradient'}
                className="w-full"
              >
                <Plug className="h-4 w-4 mr-2" />
                {integration.connected ? 'Konfigurieren' : 'Verbinden'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}