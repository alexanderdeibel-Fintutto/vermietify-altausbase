import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, CheckCircle, Circle } from 'lucide-react';

const integrations = [
    {
        name: 'Stripe',
        description: 'Zahlungsabwicklung und Abonnement-Management',
        status: 'connected',
        logo: '💳'
    },
    {
        name: 'ELSTER',
        description: 'Elektronische Steuererklärung',
        status: 'available',
        logo: '🏛️'
    },
    {
        name: 'FinAPI',
        description: 'Banking-Synchronisation',
        status: 'available',
        logo: '🏦'
    },
    {
        name: 'LetterXpress',
        description: 'Postalischer Versand von Dokumenten',
        status: 'available',
        logo: '✉️'
    },
    {
        name: 'WhatsApp Business',
        description: 'Mieter-Kommunikation via WhatsApp',
        status: 'available',
        logo: '💬'
    },
    {
        name: 'DATEV',
        description: 'Export für Steuerberater',
        status: 'available',
        logo: '📊'
    },
    {
        name: 'Google Drive',
        description: 'Dokumenten-Synchronisation',
        status: 'available',
        logo: '📁'
    },
    {
        name: 'Slack',
        description: 'Team-Benachrichtigungen',
        status: 'connected',
        logo: '💼'
    }
];

export default function SettingsIntegrations() {
    return (
        <div className="p-6 max-w-4xl">
            <div className="vf-page-header mb-6">
                <div>
                    <h1 className="vf-page-title">Integrationen</h1>
                    <p className="vf-page-subtitle">Verbinden Sie Vermitify mit anderen Tools</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {integrations.map((integration, idx) => (
                    <Card key={idx}>
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                                        {integration.logo}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">{integration.name}</h3>
                                        <p className="text-sm text-gray-600">{integration.description}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between pt-4">
                                {integration.status === 'connected' ? (
                                    <>
                                        <Badge className="vf-badge-success">
                                            <CheckCircle className="w-3 h-3 mr-1" />
                                            Verbunden
                                        </Badge>
                                        <Button variant="outline" size="sm">
                                            Konfigurieren
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Badge className="vf-badge-default">
                                            <Circle className="w-3 h-3 mr-1" />
                                            Verfügbar
                                        </Badge>
                                        <Button variant="outline" size="sm">
                                            <ExternalLink className="w-4 h-4" />
                                            Verbinden
                                        </Button>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}