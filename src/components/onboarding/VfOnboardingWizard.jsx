import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import VermitifyLogo from '@/components/branding/VermitifyLogo';
import { cn } from '@/lib/utils';
import { ChevronRight, ChevronLeft } from 'lucide-react';

export function VfOnboardingWizard({ 
  steps = [], 
  currentStep, 
  onStepChange,
  onComplete,
  children 
}) {
  const totalSteps = steps.length;
  const step = steps[currentStep];

  return (
    <div className="vf-onboarding">
      <div className="vf-onboarding__card">
        <div className="vf-onboarding__logo">
          <VermitifyLogo size="lg" colorMode="gradient" />
        </div>
        
        <h1 className="vf-onboarding__title">{step.title}</h1>
        {step.description && (
          <p className="vf-onboarding__description">{step.description}</p>
        )}
        
        <div className="mb-8">
          {children}
        </div>
        
        <div className="flex gap-3 justify-center mb-6">
          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={() => onStepChange(currentStep - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Zurück
            </Button>
          )}
          
          {currentStep < totalSteps - 1 ? (
            <Button
              variant="gradient"
              onClick={() => onStepChange(currentStep + 1)}
            >
              Weiter
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button variant="gradient" onClick={onComplete}>
              Abschließen
            </Button>
          )}
        </div>
        
        <div className="vf-onboarding__progress">
          {steps.map((_, index) => (
            <React.Fragment key={index}>
              <div className={cn(
                "vf-onboarding__progress-dot",
                index === currentStep && "vf-onboarding__progress-dot--active"
              )} />
              {index < steps.length - 1 && (
                <div className="vf-onboarding__progress-line" />
              )}
            </React.Fragment>
          ))}
        </div>
        
        <div className="text-sm text-[var(--theme-text-muted)] mt-4">
          Schritt {currentStep + 1} von {totalSteps}
        </div>
      </div>
    </div>
  );
}

export function VfOnboardingOptions({ options = [], value, onChange }) {
  return (
    <div className="vf-onboarding__options">
      {options.map((option) => {
        const OptionIcon = option.icon;
        return (
          <div
            key={option.id}
            onClick={() => onChange(option.id)}
            className={cn(
              "vf-onboarding__option",
              value === option.id && "vf-onboarding__option--selected"
            )}
          >
            {OptionIcon && (
              <div className="vf-onboarding__option-icon">
                <OptionIcon className="h-5 w-5" />
              </div>
            )}
            <div className="vf-onboarding__option-title">{option.label}</div>
            {option.description && (
              <div className="vf-onboarding__option-desc">{option.description}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}