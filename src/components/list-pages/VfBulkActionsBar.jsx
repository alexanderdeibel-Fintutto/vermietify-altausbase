import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

const VfBulkActionsBar = React.forwardRef(({ 
  selectedCount,
  onClear,
  actions,
  className,
  ...props 
}, ref) => {
  if (selectedCount === 0) return null;

  return (
    <div ref={ref} className={cn("vf-bulk-actions-bar", className)} {...props}>
      <div className="vf-bulk-actions-count">
        {selectedCount} {selectedCount === 1 ? 'Element' : 'Elemente'} ausgewählt
      </div>
      <div className="vf-bulk-actions-buttons">
        {actions}
      </div>
      <button onClick={onClear} className="ml-auto p-2 hover:bg-white/20 rounded">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
})
VfBulkActionsBar.displayName = "VfBulkActionsBar"

export { VfBulkActionsBar }