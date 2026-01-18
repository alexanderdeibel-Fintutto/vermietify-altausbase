import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/shared/StatusBadge';
import { Plug, Check, X } from 'lucide-react';

export default function SettingsIntegrations() {
  const integrations = [
    { id: 'finapi', name: 'finAPI Banking', status: 'active', icon: '🏦', description: 'Bankkonto-Synchronisation' },
    { id: 'letterxpress', name: 'LetterXpress', status: 'inactive', icon: '✉️', description: 'Brief-Versand' },
    { id: 'elster', name: 'ELSTER', status: 'inactive', icon: '📋', description: 'Steuer-Export' },
    { id: 'slack', name: 'Slack', status: 'active', icon: '💬', description: 'Team-Benachrichtigungen' }
  ];

  return (
    <div className="vf-settings__section">
      <h2 className="vf-settings__section-title">Integrationen</h2>

      <div className="space-y-4">
        {integrations.map((integration) => (
          <Card key={integration.id}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="text-4xl">{integration.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold">{integration.name}</h3>
                    <StatusBadge status={integration.status} />
                  </div>
                  <p className="text-sm text-[var(--theme-text-secondary)]">
                    {integration.description}
                  </p>
                </div>
                <Button variant={integration.status === 'active' ? 'secondary' : 'gradient'}>
                  {integration.status === 'active' ? 'Trennen' : 'Verbinden'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}