import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const VfBulkActionsBar = React.forwardRef(({ 
  selectedCount,
  actions,
  onClear,
  className,
  ...props 
}, ref) => {
  if (selectedCount === 0) return null

  return (
    <div ref={ref} className={cn("vf-bulk-actions-bar", className)} {...props}>
      <div className="vf-bulk-actions-count">
        {selectedCount} {selectedCount === 1 ? "Element" : "Elemente"} ausgewählt
      </div>
      <div className="vf-bulk-actions-buttons">
        {actions}
      </div>
      <button 
        onClick={onClear}
        className="ml-auto vf-bulk-action-btn"
        type="button"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
})
VfBulkActionsBar.displayName = "VfBulkActionsBar"

export { VfBulkActionsBar }