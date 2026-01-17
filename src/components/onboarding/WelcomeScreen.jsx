import React from 'react';
import { Button } from '@/components/ui/button';
import VermitifyLogo from '@/components/branding/VermitifyLogo';
import { Sparkles } from 'lucide-react';

export default function WelcomeScreen({ onStart, userName }) {
  return (
    <div className="vf-onboarding">
      <div className="vf-onboarding__card">
        <VermitifyLogo size="xl" className="vf-onboarding__logo" />
        
        <h1 className="vf-onboarding__title">
          Willkommen bei vermitify{userName && `, ${userName}`}! 👋
        </h1>
        
        <p className="vf-onboarding__description">
          Lassen Sie uns gemeinsam Ihre Immobilienverwaltung einrichten. 
          Das dauert nur 3 Minuten.
        </p>
        
        <div className="vf-onboarding__cta">
          <Button variant="gradient" size="lg" onClick={onStart}>
            <Sparkles className="h-5 w-5 mr-2" />
            Los geht's!
          </Button>
        </div>

        <div className="vf-onboarding__progress">
          <div className="vf-onboarding__progress-dot vf-onboarding__progress-dot--active" />
          <div className="vf-onboarding__progress-line" />
          <div className="vf-onboarding__progress-dot" />
          <div className="vf-onboarding__progress-line" />
          <div className="vf-onboarding__progress-dot" />
        </div>
      </div>
    </div>
  );
}