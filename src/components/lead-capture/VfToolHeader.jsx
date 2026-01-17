import * as React from "react"
import { cn } from "@/lib/utils"

const VfToolHeader = React.forwardRef(({ 
  icon,
  badge,
  title,
  description,
  className,
  ...props 
}, ref) => {
  return (
    <div ref={ref} className={cn("vf-tool-header", className)} {...props}>
      {icon && <div className="vf-tool-icon">{icon}</div>}
      {badge && <span className="vf-tool-badge">{badge}</span>}
      <h1 className="vf-tool-title">{title}</h1>
      {description && <p className="vf-tool-description">{description}</p>}
    </div>
  );
})
VfToolHeader.displayName = "VfToolHeader"

export { VfToolHeader }