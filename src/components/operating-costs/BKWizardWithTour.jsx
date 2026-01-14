import React from 'react';
import SimplifiedBKWizard from './SimplifiedBKWizard';
import FeatureTourManager from '@/components/help/FeatureTourManager';

export default function BKWizardWithTour({ open, onOpenChange }) {
  const [showTour, setShowTour] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      // Check if user has seen the tour before
      const hasSeenTour = localStorage.getItem('bk-wizard-tour-completed');
      if (!hasSeenTour) {
        setTimeout(() => setShowTour(true), 500);
      }
    }
  }, [open]);

  return (
    <>
      <SimplifiedBKWizard open={open} onOpenChange={onOpenChange} />
      
      {showTour && (
        <FeatureTourManager
          tourId="bk-wizard"
          onComplete={() => {
            setShowTour(false);
            localStorage.setItem('bk-wizard-tour-completed', 'true');
          }}
        />
      )}
    </>
  );
}