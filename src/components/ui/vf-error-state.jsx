import * as React from "react"
import { AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

const VfErrorState = React.forwardRef(({ 
  title = "Etwas ist schiefgelaufen",
  description,
  error,
  onRetry,
  fullpage,
  className,
  ...props 
}, ref) => {
  return (
    <div 
      ref={ref} 
      className={cn(
        "vf-error-state", 
        fullpage && "vf-error-state-fullpage", 
        className
      )} 
      {...props}
    >
      <div className="vf-empty-state">
        <AlertCircle className="vf-empty-state-icon text-[var(--vf-destructive-500)]" />
        <div className="vf-error-state-title">{title}</div>
        {description && <div className="vf-error-state-description">{description}</div>}
        {error && (
          <pre className="text-xs text-left bg-[var(--vf-destructive-100)] p-3 rounded-lg mt-2 max-w-md overflow-auto">
            {error.message || String(error)}
          </pre>
        )}
        {onRetry && (
          <Button onClick={onRetry} variant="outline" className="mt-4">
            Erneut versuchen
          </Button>
        )}
      </div>
    </div>
  );
})
VfErrorState.displayName = "VfErrorState"

export { VfErrorState }