import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Hook für Onboarding-State Management
 * Evaluiert automatisch, ob ein OnboardingAssistant-Dialog geöffnet werden sollte
 */
export function useOnboardingState(shouldAutoTrigger = false) {
  const [onboardingState, setOnboardingState] = useState(null);
  const [loading, setLoading] = useState(true);

  const evaluateState = useCallback(async () => {
    try {
      const res = await base44.functions.invoke('evaluateOnboardingState', {});
      setOnboardingState(res.data?.state);
      return res.data?.state;
    } catch (err) {
      console.error('Onboarding evaluation failed:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial evaluation
  useEffect(() => {
    evaluateState();
  }, [evaluateState]);

  // Re-evaluate periodically every 30s or on visibility change
  useEffect(() => {
    const interval = setInterval(evaluateState, 30000);
    const handleVisibility = () => {
      if (!document.hidden) evaluateState();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [evaluateState]);

  return {
    onboardingState,
    loading,
    refetch: evaluateState,
    shouldShow: onboardingState?.should_show_onboarding && shouldAutoTrigger
  };
}