import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export function useOnboardingFunnelTracking(currentStep, totalSteps, wizardName) {
  const [startTime, setStartTime] = React.useState(null);

  useEffect(() => {
    setStartTime(Date.now());
  }, [currentStep]);

  useEffect(() => {
    if (startTime && currentStep > 0) {
      const timeSpent = Date.now() - startTime;
      
      base44.analytics.track({
        eventName: 'onboarding_step_completed',
        properties: {
          wizard_name: wizardName,
          step_number: currentStep - 1,
          total_steps: totalSteps,
          time_spent_ms: timeSpent,
          completion_percentage: ((currentStep - 1) / totalSteps) * 100
        }
      });
    }
  }, [currentStep]);

  const trackWizardStart = () => {
    base44.analytics.track({
      eventName: 'onboarding_wizard_started',
      properties: {
        wizard_name: wizardName,
        total_steps: totalSteps
      }
    });
  };

  const trackWizardComplete = () => {
    base44.analytics.track({
      eventName: 'onboarding_wizard_completed',
      properties: {
        wizard_name: wizardName,
        total_steps: totalSteps
      }
    });
  };

  const trackWizardAbandoned = (stepNumber) => {
    base44.analytics.track({
      eventName: 'onboarding_wizard_abandoned',
      properties: {
        wizard_name: wizardName,
        abandoned_at_step: stepNumber,
        total_steps: totalSteps,
        completion_percentage: (stepNumber / totalSteps) * 100
      }
    });
  };

  return {
    trackWizardStart,
    trackWizardComplete,
    trackWizardAbandoned
  };
}