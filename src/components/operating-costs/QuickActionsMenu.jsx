import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Building2, Gauge, HelpCircle } from 'lucide-react';

export default function QuickActionsMenu() {
  const actions = [
    {
      icon: Plus,
      label: 'Neue Abrechnung',
      description: 'Wizard starten',
      link: 'OperatingCostWizard',
      variant: 'default'
    },
    {
      icon: FileText,
      label: 'Abrechnungen',
      description: 'Alle ansehen',
      link: 'OperatingCosts',
      variant: 'outline'
    },
    {
      icon: Building2,
      label: 'Objekte',
      description: 'Verwalten',
      link: 'Buildings',
      variant: 'outline'
    },
    {
      icon: Gauge,
      label: 'Zählerstände',
      description: 'Erfassen',
      link: 'MeterReadings',
      variant: 'outline'
    }
  ];

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="font-semibold mb-4">Schnellzugriff</h2>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <Link key={idx} to={createPageUrl(action.link)}>
                <Button 
                  variant={action.variant}
                  className="w-full h-auto flex-col items-start p-4 gap-2"
                >
                  <Icon className="w-6 h-6" />
                  <div className="text-left">
                    <p className="font-semibold text-sm">{action.label}</p>
                    <p className="text-xs opacity-70">{action.description}</p>
                  </div>
                </Button>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}