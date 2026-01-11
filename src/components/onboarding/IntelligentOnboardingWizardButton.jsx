import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HelpCircle } from 'lucide-react';
import { useOnboardingState } from './useOnboardingState';
import IntelligentOnboardingWizardDialog from './IntelligentOnboardingWizardDialog';

const IntelligentOnboardingWizardButton = React.memo(function IntelligentOnboardingWizardButton() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSkipped, setIsSkipped] = useState(false);
  const { onboardingState, loading, refetch } = useOnboardingState();

  const handleOpenDialog = useCallback(() => setDialogOpen(true), []);

  const handleSkip = async (e) => {
    e.stopPropagation();
    setIsSkipped(true);
    setDialogOpen(false);
    
    try {
      const base44 = await import('@/api/base44Client').then(m => m.base44);
      const onboardingRecords = await base44.entities.UserOnboarding.filter(
        { user_id: onboardingState.user_id },
        null,
        1
      );
      
      if (onboardingRecords[0]) {
        const skipUntil = new Date();
        skipUntil.setHours(skipUntil.getHours() + 24);
        
        await base44.entities.UserOnboarding.update(
          onboardingRecords[0].id,
          { skip_until: skipUntil.toISOString() }
        );
      }
    } catch (err) {
      console.error('Skip save failed:', err);
    }
    
    setTimeout(() => setIsSkipped(false), 24 * 60 * 60 * 1000);
  };

  const handleDialogClose = async () => {
    setDialogOpen(false);
    // Re-evaluate after dialog closes in case something changed
    await refetch();
  };

  if (loading || !onboardingState || !onboardingState.should_show_onboarding || isSkipped) {
    return null;
  }

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-8 left-8 z-40">
        <div
          onClick={handleOpenDialog}
          className="relative group cursor-pointer"
          role="button"
          aria-label="Hilfe-Assistent öffnen"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full blur opacity-75 group-hover:opacity-100 transition animate-pulse"></div>
          <div
            className="relative bg-blue-600 text-white rounded-full w-14 h-14 shadow-lg flex items-center justify-center gap-2"
          >
            <HelpCircle className="w-5 h-5" />
          </div>
        </div>

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
});

export default IntelligentOnboardingWizardButton;