import React from 'react';
import { VfMarketingLayout } from '@/components/marketing/VfMarketingLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, FileText, TrendingUp, Shield } from 'lucide-react';

export default function VermitifyPartners() {
  const partners = [
    {
      name: 'ELSTER',
      description: 'Offizielle ELSTER-Schnittstelle für Steuererklärungen',
      logo: null,
      category: 'Steuern'
    },
    {
      name: 'LetterXpress',
      description: 'Automatischer Briefversand für Dokumente',
      logo: null,
      category: 'Versand'
    },
    {
      name: 'FinAPI',
      description: 'Banking-Integration für automatische Zahlungsabgleich',
      logo: null,
      category: 'Finanzen'
    },
    {
      name: 'Stripe',
      description: 'Sichere Zahlungsabwicklung',
      logo: null,
      category: 'Zahlungen'
    }
  ];

  const integrations = [
    {
      icon: Building2,
      title: 'Immobilienportale',
      description: 'Import von Objektdaten aus gängigen Portalen'
    },
    {
      icon: FileText,
      title: 'Buchhaltung',
      description: 'DATEV, Lexware - nahtlose Integration'
    },
    {
      icon: Shield,
      title: 'Versicherungen',
      description: 'Automatischer Datenabgleich mit Versicherern'
    },
    {
      icon: TrendingUp,
      title: 'Banken',
      description: 'Über 4.000 Banken via FinAPI'
    }
  ];

  return (
    <VfMarketingLayout>
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">Partner & Integrationen</h1>
          <p className="text-xl text-[var(--theme-text-secondary)]">
            vermitify arbeitet mit den besten Partnern zusammen
          </p>
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-8">Unsere Partner</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {partners.map((partner) => (
              <Card key={partner.name} className="text-center">
                <CardContent className="p-6">
                  <div className="w-16 h-16 mx-auto mb-4 bg-[var(--vf-neutral-100)] rounded-lg flex items-center justify-center">
                    <span className="font-bold text-xl text-[var(--vf-primary-600)]">
                      {partner.name.substring(0, 2)}
                    </span>
                  </div>
                  <h3 className="font-semibold mb-2">{partner.name}</h3>
                  <p className="text-sm text-[var(--theme-text-secondary)] mb-3">
                    {partner.description}
                  </p>
                  <span className="vf-badge vf-badge-default">{partner.category}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-8">Integrationen</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {integrations.map((integration) => {
              const IntegrationIcon = integration.icon;
              return (
                <Card key={integration.title}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-[var(--vf-gradient-primary)] flex items-center justify-center text-white flex-shrink-0">
                        <IntegrationIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">{integration.title}</h3>
                        <p className="text-sm text-[var(--theme-text-secondary)]">
                          {integration.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </VfMarketingLayout>
  );
}