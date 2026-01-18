import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, X } from 'lucide-react';

export default function FeatureTourManager({ tourSteps = [] }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);

  const defaultSteps = [
    { title: 'Willkommen', description: 'Lernen Sie die Hauptfunktionen kennen' },
    { title: 'Objekte', description: 'Verwalten Sie Ihre Immobilien' },
    { title: 'Dashboard', description: 'Behalten Sie den Überblick' }
  ];

  const steps = tourSteps.length > 0 ? tourSteps : defaultSteps;

  if (!isActive) {
    return (
      <Button variant="outline" size="sm" onClick={() => setIsActive(true)}>
        <Play className="h-4 w-4 mr-2" />
        Tour starten
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl p-6 max-w-md shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <div className="font-bold">{steps[currentStep].title}</div>
          <button onClick={() => setIsActive(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <p className="text-sm text-[var(--theme-text-secondary)] mb-6">
          {steps[currentStep].description}
        </p>

        <div className="flex justify-between items-center">
          <div className="text-xs text-[var(--theme-text-muted)]">
            {currentStep + 1} von {steps.length}
          </div>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="outline" size="sm" onClick={() => setCurrentStep(currentStep - 1)}>
                Zurück
              </Button>
            )}
            <Button 
              variant="gradient" 
              size="sm"
              onClick={() => {
                if (currentStep < steps.length - 1) {
                  setCurrentStep(currentStep + 1);
                } else {
                  setIsActive(false);
                }
              }}
            >
              {currentStep < steps.length - 1 ? 'Weiter' : 'Fertig'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}