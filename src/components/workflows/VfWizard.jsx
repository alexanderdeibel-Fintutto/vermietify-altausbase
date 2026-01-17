import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const VfWizard = React.forwardRef(({ 
  steps = [],
  currentStep = 0,
  onStepChange,
  children,
  className,
  ...props 
}, ref) => {
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      onStepChange?.(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      onStepChange?.(currentStep - 1)
    }
  }

  return (
    <div ref={ref} className={cn("vf-wizard", className)} {...props}>
      <div className="vf-wizard-progress">
        {steps.map((step, index) => (
          <div 
            key={index}
            className={cn(
              "vf-wizard-progress-step",
              index === currentStep && "vf-wizard-progress-step-active",
              index < currentStep && "vf-wizard-progress-step-completed"
            )}
          >
            <div className="vf-wizard-progress-icon">
              {index < currentStep ? <Check className="h-5 w-5" /> : index + 1}
            </div>
            <div className="vf-wizard-progress-label">{step.label}</div>
          </div>
        ))}
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
            type="button"
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 0}
          >
            Zurück
          </Button>
          <Button
            type="button"
            onClick={handleNext}
            disabled={currentStep === steps.length - 1}
          >
            {currentStep === steps.length - 1 ? "Abschließen" : "Weiter"}
          </Button>
        </div>
      </div>
    </div>
  );
})
VfWizard.displayName = "VfWizard"

export { VfWizard }