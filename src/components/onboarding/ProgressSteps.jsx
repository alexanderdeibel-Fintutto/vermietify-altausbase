import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProgressSteps({ steps = [], currentStep = 0 }) {
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <div className="flex flex-col items-center">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center font-semibold mb-2",
              index < currentStep && "bg-[var(--vf-success-500)] text-white",
              index === currentStep && "bg-[var(--vf-primary-600)] text-white",
              index > currentStep && "bg-[var(--vf-neutral-200)] text-[var(--vf-neutral-500)]"
            )}>
              {index < currentStep ? <Check className="h-5 w-5" /> : index + 1}
            </div>
            <span className="text-xs text-center max-w-20">{step}</span>
          </div>
          {index < steps.length - 1 && (
            <div className={cn(
              "flex-1 h-1 mx-2",
              index < currentStep ? "bg-[var(--vf-success-500)]" : "bg-[var(--vf-neutral-200)]"
            )} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}