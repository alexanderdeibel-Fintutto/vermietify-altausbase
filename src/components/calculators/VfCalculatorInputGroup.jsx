import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

const VfCalculatorInputGroup = React.forwardRef(({ 
  title,
  children,
  className,
  ...props 
}, ref) => {
  return (
    <div ref={ref} className={cn("vf-calculator-input-group", className)} {...props}>
      {title && <div className="vf-calculator-input-group-title">{title}</div>}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
})
VfCalculatorInputGroup.displayName = "VfCalculatorInputGroup"

export { VfCalculatorInputGroup }