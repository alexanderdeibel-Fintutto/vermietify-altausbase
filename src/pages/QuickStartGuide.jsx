import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Building2, Users, FileText, Calculator } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function QuickStartGuide() {
  const steps = [
    {
      number: 1,
      title: 'Erstes Objekt anlegen',
      description: 'Erfassen Sie Ihre erste Immobilie mit allen wichtigen Daten',
      icon: Building2,
      action: 'Objekt anlegen',
      href: createPageUrl('Buildings')
    },
    {
      number: 2,
      title: 'Einheiten hinzufügen',
      description: 'Definieren Sie die Wohneinheiten in Ihrem Objekt',
      icon: Building2,
      action: 'Einheiten verwalten',
      href: createPageUrl('UnitsManagement')
    },
    {
      number: 3,
      title: 'Mieter erfassen',
      description: 'Legen Sie Ihre Mieter an und erstellen Sie Mietverträge',
      icon: Users,
      action: 'Mieter hinzufügen',
      href: createPageUrl('Tenants')
    },
    {
      number: 4,
      title: 'Rechner nutzen',
      description: 'Nutzen Sie die kostenlosen Rechner für Ihre Kalkulationen',
      icon: Calculator,
      action: 'Tools ansehen',
      href: createPageUrl('VermitifyToolsOverview')
    },
    {
      number: 5,
      title: 'Anlage V erstellen',
      description: 'Generieren Sie Ihre Steuererklärung mit einem Klick',
      icon: FileText,
      action: 'Anlage V erstellen',
      href: createPageUrl('AnlageVDashboard')
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Schnellstart-Anleitung</h1>
        <p className="text-xl text-[var(--theme-text-secondary)]">
          In 5 einfachen Schritten zu Ihrer professionellen Immobilienverwaltung
        </p>
      </div>

      <div className="space-y-6">
        {steps.map((step) => {
          const StepIcon = step.icon;
          return (
            <Card key={step.number}>
              <CardContent className="p-6">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-[var(--vf-gradient-primary)] text-white flex items-center justify-center text-xl font-bold">
                      {step.number}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                      <StepIcon className="h-5 w-5" />
                      {step.title}
                    </h3>
                    <p className="text-[var(--theme-text-secondary)] mb-4">
                      {step.description}
                    </p>
                    <Link to={step.href}>
                      <Button variant="outline">
                        {step.action} →
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--vf-success-50)] text-[var(--vf-success-700)] rounded-lg">
          <CheckCircle className="h-5 w-5" />
          <span className="font-medium">Sie können jederzeit Hilfe im Hilfe-Center finden</span>
        </div>
      </div>
    </div>
  );
}