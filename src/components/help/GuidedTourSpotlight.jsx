import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, X } from 'lucide-react';

export default function GuidedTourSpotlight({ step, onNext, onClose }) {
  if (!step) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed z-50 bg-white rounded-xl shadow-2xl p-6 max-w-md" style={step.position || { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
        <button onClick={onClose} className="absolute top-4 right-4">
          <X className="h-5 w-5" />
        </button>
        
        <h3 className="font-bold text-lg mb-2">{step.title}</h3>
        <p className="text-sm text-[var(--theme-text-secondary)] mb-6">{step.description}</p>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>Überspringen</Button>
          <Button variant="gradient" onClick={onNext} className="flex-1">
            Weiter
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </>
  );
}