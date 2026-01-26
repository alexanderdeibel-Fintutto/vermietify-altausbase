import React from 'react';
import { Check } from 'lucide-react';

export default function WizardProgress({ steps, currentStep }) {
  return (
    <div className="relative">
      {/* Progress Line */}
      <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -z-10">
        <div 
          className="h-full bg-blue-900 transition-all duration-300"
          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        />
      </div>

      {/* Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, idx) => (
          <div key={step.id} className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 bg-white transition-colors ${
              idx < currentStep ? 'border-blue-900 bg-blue-900' :
              idx === currentStep ? 'border-blue-900' :
              'border-gray-300'
            }`}>
              {idx < currentStep ? (
                <Check className="w-5 h-5 text-white" />
              ) : (
                <span className={idx === currentStep ? 'text-blue-900 font-semibold' : 'text-gray-400'}>
                  {idx + 1}
                </span>
              )}
            </div>
            <span className={`text-xs mt-2 max-w-[80px] text-center ${
              idx === currentStep ? 'font-semibold text-gray-900' : 'text-gray-600'
            }`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}