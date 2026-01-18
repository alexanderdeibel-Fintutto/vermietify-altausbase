import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, ArrowRight } from 'lucide-react';

export default function QuickStartGuide() {
  const steps = [
    { title: 'Profil vervollständigen', completed: true, description: 'Ihre Kontaktdaten hinzufügen' },
    { title: 'Erstes Objekt anlegen', completed: false, description: 'Fügen Sie Ihre erste Immobilie hinzu' },
    { title: 'Einheiten erstellen', completed: false, description: 'Definieren Sie Wohnungen/Gewerbe' },
    { title: 'Mieter hinzufügen', completed: false, description: 'Legen Sie Ihre Mieter an' },
    { title: 'Vertrag erstellen', completed: false, description: 'Erstellen Sie den ersten Mietvertrag' }
  ];

  return (
    <div className="min-h-screen bg-[var(--theme-background)] p-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Schnellstart-Anleitung</h1>
          <p className="text-[var(--theme-text-secondary)]">
            Folgen Sie diesen Schritten für einen optimalen Start
          </p>
        </div>

        <div className="space-y-4">
          {steps.map((step, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    step.completed 
                      ? 'bg-[var(--vf-success-500)] text-white' 
                      : 'bg-[var(--theme-surface)] text-[var(--theme-text-muted)]'
                  }`}>
                    {step.completed ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{step.title}</h3>
                    <p className="text-sm text-[var(--theme-text-secondary)] mb-3">
                      {step.description}
                    </p>
                    {!step.completed && (
                      <Button variant="outline" size="sm">
                        Jetzt starten
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}