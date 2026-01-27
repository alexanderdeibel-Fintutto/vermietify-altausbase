import * as React from "react"
import { cn } from "@/lib/utils"

const VfLeadCapturePage = React.forwardRef(({ 
  header,
  children,
  className,
  ...props 
}, ref) => {
  return (
    <div ref={ref} className={cn("vf-lead-page", className)} {...props}>
      {header && <div className="vf-lead-page-header">{header}</div>}
      <div className="vf-lead-page-content">{children}</div>
    </div>
  );
})
VfLeadCapturePage.displayName = "VfLeadCapturePage"

export default VfLeadCapturePage
export { VfLeadCapturePage }