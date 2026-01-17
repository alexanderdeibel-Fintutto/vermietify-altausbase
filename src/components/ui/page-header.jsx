import * as React from "react"
import { ChevronLeft } from "lucide-react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"

const VfPageHeader = React.forwardRef(({ 
  backLink,
  title,
  subtitle,
  actions,
  className,
  ...props 
}, ref) => {
  return (
    <div ref={ref} className={cn("vf-page-header", className)} {...props}>
      <div>
        {backLink && (
          <Link to={backLink} className="vf-page-back">
            <ChevronLeft className="h-4 w-4" />
            Zurück
          </Link>
        )}
        <h1 className="vf-page-title">{title}</h1>
        {subtitle && <p className="vf-page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="vf-page-actions">{actions}</div>}
    </div>
  );
})
VfPageHeader.displayName = "VfPageHeader"

export { VfPageHeader }