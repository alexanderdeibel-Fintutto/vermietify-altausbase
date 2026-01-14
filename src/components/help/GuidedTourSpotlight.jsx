import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function GuidedTourSpotlight({ tourId, steps, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [targetRect, setTargetRect] = useState(null);

  useEffect(() => {
    checkIfTourCompleted();
  }, [tourId]);

  const checkIfTourCompleted = async () => {
    try {
      const user = await base44.auth.me();
      const preferences = await base44.entities.UserPreferences.filter({ user_email: user.email });
      
      const userPref = preferences[0];
      const completedTours = userPref?.completed_tours ? JSON.parse(userPref.completed_tours) : [];
      
      if (!completedTours.includes(tourId)) {
        // Start tour after 1 second
        setTimeout(() => setIsActive(true), 1000);
      }
    } catch (error) {
      console.error('Error checking tour status:', error);
    }
  };

  useEffect(() => {
    if (isActive && steps[currentStep]) {
      const selector = steps[currentStep].target;
      const element = document.querySelector(selector);
      
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentStep, isActive, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      const user = await base44.auth.me();
      const preferences = await base44.entities.UserPreferences.filter({ user_email: user.email });
      
      const userPref = preferences[0];
      const completedTours = userPref?.completed_tours ? JSON.parse(userPref.completed_tours) : [];
      
      if (!completedTours.includes(tourId)) {
        completedTours.push(tourId);
        
        if (userPref) {
          await base44.entities.UserPreferences.update(userPref.id, {
            completed_tours: JSON.stringify(completedTours)
          });
        } else {
          await base44.entities.UserPreferences.create({
            user_email: user.email,
            completed_tours: JSON.stringify(completedTours)
          });
        }
      }
    } catch (error) {
      console.error('Error saving tour completion:', error);
    }

    setIsActive(false);
    onComplete?.();
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!isActive || !steps[currentStep]) return null;

  const step = steps[currentStep];

  return (
    <AnimatePresence>
      {isActive && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[9998]"
            onClick={handleSkip}
          />

          {/* Spotlight */}
          {targetRect && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                position: 'fixed',
                top: targetRect.top - 8,
                left: targetRect.left - 8,
                width: targetRect.width + 16,
                height: targetRect.height + 16,
                border: '3px solid #10b981',
                borderRadius: '12px',
                boxShadow: '0 0 0 4px rgba(16, 185, 129, 0.2), 0 0 40px rgba(16, 185, 129, 0.4)',
                pointerEvents: 'none',
                zIndex: 9999
              }}
            />
          )}

          {/* Tooltip */}
          {targetRect && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{
                position: 'fixed',
                top: targetRect.bottom + 20,
                left: Math.max(20, Math.min(targetRect.left, window.innerWidth - 420)),
                zIndex: 10000
              }}
              className="bg-white rounded-lg shadow-2xl p-6 max-w-md border-2 border-emerald-500"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-1 rounded">
                      Schritt {currentStep + 1} von {steps.length}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900">{step.title}</h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSkip}
                  className="h-6 w-6"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <p className="text-sm text-slate-600 mb-4">{step.description}</p>

              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="text-slate-500"
                >
                  Tour überspringen
                </Button>

                <div className="flex gap-2">
                  {currentStep > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBack}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={handleNext}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {currentStep === steps.length - 1 ? 'Fertig' : 'Weiter'}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}