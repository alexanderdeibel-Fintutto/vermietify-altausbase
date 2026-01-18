import * as React from "react"
import { cn } from "@/lib/utils"

const VfEmptyState = React.forwardRef(({ 
  icon,
  title,
  description,
  action,
  size = "md",
  className,
  ...props 
}, ref) => {
  const sizeClass = size === "sm" ? "vf-empty-state-sm" : size === "lg" ? "vf-empty-state-lg" : "";

  return (
    <div ref={ref} className={cn("vf-empty-state", sizeClass, className)} {...props}>
      {icon && <div className="vf-empty-state-icon">{icon}</div>}
      {title && <div className="vf-empty-state-title">{title}</div>}
      {description && <div className="vf-empty-state-description">{description}</div>}
      {action}
    </div>
  );
})
VfEmptyState.displayName = "VfEmptyState"

export { VfEmptyState }
export default VfEmptyState