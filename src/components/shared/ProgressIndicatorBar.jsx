import React from 'react';
import { VfProgress } from './VfProgress';

export default function ProgressIndicatorBar({ steps = [], currentStep = 0 }) {
  const percentage = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium">Schritt {currentStep + 1} von {steps.length}</span>
        <span className="text-[var(--theme-text-muted)]">{Math.round(percentage)}%</span>
      </div>
      <VfProgress value={currentStep + 1} max={steps.length} variant="gradient" />
      <div className="text-sm text-[var(--theme-text-secondary)]">
        {steps[currentStep]}
      </div>
    </div>
  );
}