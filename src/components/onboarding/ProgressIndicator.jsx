import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function ProgressIndicator({ currentStep, completedSteps = [] }) {
  const steps = [
    { id: 'welcome', label: 'Willkommen' },
    { id: 'user_type', label: 'Profil' },
    { id: 'simple_object', label: 'Objekt' },
    { id: 'quick_tenant', label: 'Mieter' },
    { id: 'tax_setup', label: 'Steuern' }
  ];

  const getCurrentIndex = () => {
    const idx = steps.findIndex(s => s.id === currentStep);
    return idx === -1 ? 0 : idx;
  };

  const isCompleted = (stepId) => completedSteps.includes(stepId);
  const isCurrent = (stepId) => stepId === currentStep;

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {steps.map((step, idx) => (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center gap-1">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all",
              isCompleted(step.id) ? "bg-emerald-600" : 
              isCurrent(step.id) ? "bg-emerald-500 ring-4 ring-emerald-100" :
              "bg-slate-200"
            )}>
              {isCompleted(step.id) ? (
                <CheckCircle2 className="w-5 h-5 text-white" />
              ) : (
                <Circle className={cn(
                  "w-4 h-4",
                  isCurrent(step.id) ? "text-white" : "text-slate-400"
                )} />
              )}
            </div>
            <span className={cn(
              "text-xs",
              isCompleted(step.id) || isCurrent(step.id) ? "text-slate-700 font-medium" : "text-slate-400"
            )}>
              {step.label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div className={cn(
              "h-0.5 w-8 transition-all",
              isCompleted(step.id) ? "bg-emerald-600" : "bg-slate-200"
            )} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}