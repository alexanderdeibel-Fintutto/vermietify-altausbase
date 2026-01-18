import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { VfInput } from '@/components/shared/VfInput';
import { Home, Building, Users, TrendingUp, ArrowRight } from 'lucide-react';

export default function OnboardingEnhanced() {
  const [step, setStep] = useState(0);

  const userTypes = [
    { id: 'private', label: 'Privater Vermieter', description: '1-5 Objekte, Selbstverwaltung', icon: Home },
    { id: 'professional', label: 'Professioneller Vermieter', description: '6+ Objekte, strukturiert', icon: Building },
    { id: 'manager', label: 'Hausverwaltung', description: 'Verwaltung für Dritte', icon: Users },
    { id: 'investor', label: 'Investor', description: 'Fokus auf Rendite & Analyse', icon: TrendingUp }
  ];

  return (
    <div className="vf-onboarding">
      <div className="vf-onboarding__card">
        {step === 0 && (
          <>
            <div className="vf-onboarding__logo mb-8">🏠</div>
            <h1 className="vf-onboarding__title">Willkommen bei Vermitify!</h1>
            <p className="vf-onboarding__description">
              Ihre Immobilien verwalten sich von selbst. Die Steuern auch.
              <br /><br />
              In nur 5 Minuten richten wir gemeinsam Ihr erstes Objekt ein.
            </p>
            <Button variant="gradient" size="lg" onClick={() => setStep(1)} className="vf-onboarding__cta">
              Los geht's
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <div className="vf-onboarding__progress">
              <div className="vf-onboarding__progress-dot vf-onboarding__progress-dot--active" />
              <div className="vf-onboarding__progress-line" />
              <div className="vf-onboarding__progress-dot" />
              <div className="vf-onboarding__progress-line" />
              <div className="vf-onboarding__progress-dot" />
              <div className="vf-onboarding__progress-line" />
              <div className="vf-onboarding__progress-dot" />
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h1 className="vf-onboarding__title">Wer sind Sie?</h1>
            <p className="vf-onboarding__description mb-8">
              Damit wir Vermitify optimal für Sie konfigurieren können
            </p>
            <div className="vf-onboarding__options">
              {userTypes.map((type) => (
                <div key={type.id} className="vf-onboarding__option">
                  <div className="vf-onboarding__option-icon">
                    <type.icon className="h-5 w-5" />
                  </div>
                  <div className="vf-onboarding__option-title">{type.label}</div>
                  <div className="vf-onboarding__option-desc">{type.description}</div>
                </div>
              ))}
            </div>
            <Button variant="gradient" size="lg" onClick={() => setStep(2)} className="mt-8 w-full">
              Weiter
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}