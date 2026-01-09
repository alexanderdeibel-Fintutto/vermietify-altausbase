import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import IntelligentOnboardingWizardDialog from './IntelligentOnboardingWizardDialog';

export default function IntelligentOnboardingWizardButton() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [onboardingState, setOnboardingState] = useState(null);
  const [isSkipped, setIsSkipped] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    evaluateState();
    // Re-evaluate every 60 seconds or when page becomes visible
    const interval = setInterval(evaluateState, 60000);
    const handleVisibility = () => {
      if (!document.hidden) evaluateState();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const evaluateState = async () => {
    try {
      const res = await base44.functions.invoke('evaluateOnboardingState', {});
      setOnboardingState(res.data?.state);
      
      // Auto-open if should show and not skipped
      if (res.data?.state?.should_show_onboarding && !isSkipped) {
        // Only auto-open if it's been at least 10 seconds since page load
        setTimeout(() => setDialogOpen(true), 10000);
      }
    } catch (err) {
      console.error('Onboarding evaluation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = (e) => {
    e.stopPropagation();
    setIsSkipped(true);
    setDialogOpen(false);
    
    // Reset skip after 24 hours
    setTimeout(() => setIsSkipped(false), 24 * 60 * 60 * 1000);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    // Re-evaluate after dialog closes in case something changed
    evaluateState();
  };

  if (loading || !onboardingState || !onboardingState.should_show_onboarding || isSkipped) {
    return null;
  }

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-8 left-8 z-40">
        <button
          onClick={() => setDialogOpen(true)}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full blur opacity-75 group-hover:opacity-100 transition animate-pulse"></div>
          <Button
            className="relative bg-blue-600 hover:bg-blue-700 text-white rounded-full w-14 h-14 shadow-lg flex items-center justify-center gap-2"
          >
            <HelpCircle className="w-5 h-5" />
          </Button>
        </button>

        {/* Mini Preview */}
        {onboardingState.next_step && (
          <div className="absolute bottom-20 left-0 bg-white border border-slate-200 rounded-lg p-3 w-48 shadow-lg">
            <Badge className="bg-blue-100 text-blue-800 font-light text-xs mb-2">
              {Math.round((onboardingState.completed_steps.length / onboardingState.all_steps.length) * 100)}% Fertig
            </Badge>
            <p className="text-sm font-light text-slate-900">{onboardingState.next_step.title}</p>
            <p className="text-xs font-light text-slate-600 mt-1">{onboardingState.next_step.description}</p>
          </div>
        )}
      </div>

      {/* Dialog */}
      <IntelligentOnboardingWizardDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        onboardingState={onboardingState}
        onSkip={handleSkip}
      />
    </>
  );
}