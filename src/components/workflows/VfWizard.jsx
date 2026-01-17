import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Check } from "lucide-react"

const VfWizard = React.forwardRef(({ 
  steps = [],
  currentStep = 0,
  onStepChange,
  children,
  className,
  ...props 
}, ref) => {
  const canGoNext = currentStep < steps.length - 1;
  const canGoPrev = currentStep > 0;

  return (
    <div ref={ref} className={cn("vf-wizard", className)} {...props}>
      <div className="vf-wizard-progress">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;

          return (
            <div 
              key={index} 
              className={cn(
                "vf-wizard-progress-step",
                isActive && "vf-wizard-progress-step-active",
                isCompleted && "vf-wizard-progress-step-completed"
              )}
            >
              <div className="vf-wizard-progress-icon">
                {isCompleted ? <Check className="h-5 w-5" /> : index + 1}
              </div>
              <span className="vf-wizard-progress-label">{step.label}</span>
            </div>
          );
        })}
      </div>

      <div className="vf-wizard-content">
        <div className="vf-wizard-step-header">
          <h2 className="vf-wizard-step-title">{steps[currentStep]?.title}</h2>
          {steps[currentStep]?.description && (
            <p className="vf-wizard-step-description">{steps[currentStep].description}</p>
          )}
        </div>

        <div className="vf-wizard-step-content">
          {children}
        </div>

        <div className="vf-wizard-actions">
          <Button
            variant="outline"
            onClick={() => onStepChange?.(currentStep - 1)}
            disabled={!canGoPrev}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>
          <Button
            variant="primary"
            onClick={() => onStepChange?.(currentStep + 1)}
            disabled={!canGoNext}
          >
            Weiter
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
})
VfWizard.displayName = "VfWizard"

export { VfWizard }