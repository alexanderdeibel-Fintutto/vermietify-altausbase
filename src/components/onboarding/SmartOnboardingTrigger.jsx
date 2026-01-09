import { useEffect, useState } from 'react';
import { useOnboardingState } from './useOnboardingState';

/**
 * Komponente für Smart Triggering - öffnet Dialog wenn bestimmte Bedingungen erfüllt sind
 * Wird auf Seiten verwendet, die kritische Daten benötigen
 */
export function useSmartOnboardingTrigger(enabled = true) {
  const [shouldOpen, setShouldOpen] = useState(false);
  const { onboardingState, refetch } = useOnboardingState();

  useEffect(() => {
    if (!enabled || !onboardingState) return;

    // Öffne Dialog wenn:
    // 1. Required Step vorhanden ist
    // 2. Und dieser Step nicht geskippt wurde
    // 3. Und noch nicht completed
    if (
      onboardingState.next_step?.required &&
      onboardingState.should_show_onboarding
    ) {
      // Mit kleiner Verzögerung für bessere UX
      const timer = setTimeout(() => setShouldOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [onboardingState, enabled]);

  return {
    shouldOpen,
    setShouldOpen,
    onboardingState,
    refetch
  };
}

/**
 * Wrapper-Komponente für Smart Triggering
 * Wird z.B. auf Buildings-Seite verwendet um Dialog zu öffnen wenn 0 Buildings existieren
 */
export default function SmartOnboardingTrigger({ children, enabled = true }) {
  const { shouldOpen, setShouldOpen, onboardingState, refetch } = useSmartOnboardingTrigger(enabled);

  if (!shouldOpen || !onboardingState?.next_step) {
    return children;
  }

  // Hier könnten wir einen Modal öffnen, aber wir verlassen uns auf den Button
  // Diese Komponente ist eher für Logging und State Management
  return children;
}