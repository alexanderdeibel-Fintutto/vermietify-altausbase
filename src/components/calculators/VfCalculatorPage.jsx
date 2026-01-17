import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Download, Share2, RotateCcw } from "lucide-react"

const VfCalculatorPage = React.forwardRef(({ 
  inputPanel,
  resultPanel,
  className,
  ...props 
}, ref) => {
  return (
    <div ref={ref} className={cn("vf-calculator", className)} {...props}>
      {inputPanel}
      {resultPanel}
    </div>
  );
})
VfCalculatorPage.displayName = "VfCalculatorPage"

const VfCalculatorForm = React.forwardRef(({ 
  title,
  children,
  onCalculate,
  onReset,
  className,
  ...props 
}, ref) => {
  return (
    <div ref={ref} className={cn("vf-calculator-input-panel", className)} {...props}>
      {title && <h2 className="text-xl font-semibold mb-6">{title}</h2>}
      {children}
      <div className="vf-calculator-actions">
        <Button variant="gradient" onClick={onCalculate} className="flex-1">
          Berechnen
        </Button>
        {onReset && (
          <Button variant="outline" onClick={onReset}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
})
VfCalculatorForm.displayName = "VfCalculatorForm"

const VfCalculatorResult = React.forwardRef(({ 
  primaryResult,
  secondaryResults = [],
  breakdown = [],
  actions,
  empty,
  className,
  ...props 
}, ref) => {
  if (empty) {
    return (
      <div ref={ref} className={cn("vf-calculator-result-panel", className)} {...props}>
        <div className="vf-calculator-result-empty">{empty}</div>
      </div>
    );
  }

  return (
    <div ref={ref} className={cn("vf-calculator-result-panel", className)} {...props}>
      {primaryResult && (
        <div className="vf-calculator-primary-result">
          <div className="vf-calculator-primary-label">{primaryResult.label}</div>
          <div className="vf-calculator-primary-value">{primaryResult.value}</div>
        </div>
      )}

      {secondaryResults.length > 0 && (
        <div className="vf-calculator-secondary-results">
          {secondaryResults.map((result, index) => (
            <div key={index} className="vf-calculator-secondary-item">
              <div className="vf-calculator-secondary-label">{result.label}</div>
              <div className="vf-calculator-secondary-value">{result.value}</div>
            </div>
          ))}
        </div>
      )}

      {breakdown.length > 0 && (
        <div className="vf-calculator-breakdown">
          <div className="vf-calculator-breakdown-title">Aufschlüsselung</div>
          {breakdown.map((item, index) => (
            <div 
              key={index} 
              className={cn(
                "vf-calculator-breakdown-item",
                item.type === "income" && "vf-calculator-breakdown-item-income",
                item.type === "expense" && "vf-calculator-breakdown-item-expense"
              )}
            >
              <span>{item.label}</span>
              <span>{item.value}</span>
            </div>
          ))}
        </div>
      )}

      {actions && (
        <div className="vf-calculator-result-actions">
          {actions}
        </div>
      )}
    </div>
  );
})
VfCalculatorResult.displayName = "VfCalculatorResult"

export { VfCalculatorPage, VfCalculatorForm, VfCalculatorResult }