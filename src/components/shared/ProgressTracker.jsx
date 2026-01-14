import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProgressTracker({ steps = [], currentStep = 0 }) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, idx) => (
          <React.Fragment key={idx}>
            <div className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all',
                  idx < currentStep
                    ? 'bg-green-600 border-green-600'
                    : idx === currentStep
                    ? 'bg-blue-600 border-blue-600'
                    : 'bg-white border-slate-300'
                )}
              >
                {idx < currentStep ? (
                  <Check className="w-5 h-5 text-white" />
                ) : (
                  <span
                    className={cn(
                      'text-sm font-medium',
                      idx === currentStep ? 'text-white' : 'text-slate-500'
                    )}
                  >
                    {idx + 1}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  'mt-2 text-xs text-center max-w-24',
                  idx <= currentStep ? 'text-slate-900 font-medium' : 'text-slate-500'
                )}
              >
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={cn(
                  'h-0.5 flex-1 -mt-8 transition-colors',
                  idx < currentStep ? 'bg-green-600' : 'bg-slate-300'
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}