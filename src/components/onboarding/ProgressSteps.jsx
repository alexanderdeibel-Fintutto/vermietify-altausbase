import React from 'react';
import { CheckCircle, Circle } from 'lucide-react';

export default function ProgressSteps({ steps, currentStep }) {
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              index < currentStep 
                ? 'bg-[var(--vf-success-500)] text-white' 
                : index === currentStep
                ? 'bg-[var(--theme-primary)] text-white'
                : 'bg-[var(--theme-surface)] text-[var(--theme-text-muted)]'
            }`}>
              {index < currentStep ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <Circle className="h-5 w-5" />
              )}
            </div>
            <span className="text-xs mt-2 text-center max-w-[80px]">{step}</span>
          </div>
          {index < steps.length - 1 && (
            <div className={`flex-1 h-0.5 ${
              index < currentStep ? 'bg-[var(--vf-success-500)]' : 'bg-[var(--theme-border)]'
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}