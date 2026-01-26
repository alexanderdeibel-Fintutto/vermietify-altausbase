import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlayCircle, Building2, Users, Calculator, FileText, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function QuickStartGuide() {
  const steps = [
    {
      icon: Building2,
      title: 'Objekt auswählen',
      description: 'Wählen Sie das Gebäude und die Wohneinheiten für die Abrechnung'
    },
    {
      icon: Users,
      title: 'Mietverträge prüfen',
      description: 'System erkennt automatisch aktive Verträge und Leerstände'
    },
    {
      icon: Calculator,
      title: 'Kosten erfassen',
      description: 'Kostenarten auswählen und Verteilschlüssel festlegen'
    },
    {
      icon: FileText,
      title: 'Berechnung',
      description: 'Automatische Berechnung mit HeizkostenV-Aufteilung'
    },
    {
      icon: Send,
      title: 'Versenden',
      description: 'PDF-Abrechnungen per Email an alle Mieter'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlayCircle className="w-5 h-5 text-blue-600" />
          So erstellen Sie eine Abrechnung
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={idx} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-blue-700" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{idx + 1}. {step.title}</p>
                  <p className="text-xs text-gray-600 mt-1">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        <Link to={createPageUrl('OperatingCostWizard')} className="block mt-6">
          <Button className="w-full bg-gradient-to-r from-blue-900 to-blue-700">
            Jetzt starten
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}