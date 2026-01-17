import React, { useState } from 'react';
import { VfModal } from '@/components/shared/VfModal';
import { Button } from '@/components/ui/button';
import { Compass, ArrowRight, ArrowLeft } from 'lucide-react';

export default function FeatureTourManager({ open, onClose, steps = [] }) {
  const [currentStep, setCurrentStep] = useState(0);

  const defaultSteps = [
    {
      title: 'Willkommen bei vermitify',
      description: 'Lernen Sie die wichtigsten Funktionen kennen',
      image: '🏠'
    },
    {
      title: 'Objekte verwalten',
      description: 'Fügen Sie Ihre Immobilien hinzu und verwalten Sie alle Details',
      image: '🏢'
    },
    {
      title: 'Mieter & Verträge',
      description: 'Erfassen Sie Mieterdaten und erstellen Sie Verträge',
      image: '📄'
    }
  ];

  const tourSteps = steps.length > 0 ? steps : defaultSteps;
  const step = tourSteps[currentStep];

  return (
    <VfModal
      open={open}
      onOpenChange={onClose}
      title="Feature-Tour"
    >
      <div className="text-center py-6">
        <div className="text-6xl mb-4">{step.image}</div>
        <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
        <p className="text-[var(--theme-text-secondary)] mb-6">{step.description}</p>

        <div className="flex items-center justify-center gap-2 mb-6">
          {tourSteps.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentStep 
                  ? 'w-8 bg-[var(--theme-primary)]' 
                  : 'w-2 bg-[var(--theme-border)]'
              }`}
            />
          ))}
        </div>

        <div className="flex gap-3 justify-center">
          {currentStep > 0 && (
            <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück
            </Button>
          )}
          {currentStep < tourSteps.length - 1 ? (
            <Button variant="gradient" onClick={() => setCurrentStep(currentStep + 1)}>
              Weiter
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button variant="gradient" onClick={onClose}>
              Tour beenden
            </Button>
          )}
        </div>
      </div>
    </VfModal>
  );
}