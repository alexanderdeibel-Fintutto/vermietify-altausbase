import * as React from "react"
import { ChevronRight } from "lucide-react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"

const VfBreadcrumb = React.forwardRef(({ 
  items = [],
  className,
  ...props 
}, ref) => {
  return (
    <nav ref={ref} className={cn("vf-breadcrumb", className)} {...props}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {item.href ? (
            <Link to={item.href} className="vf-breadcrumb-item">
              {item.label}
            </Link>
          ) : (
            <span className={cn("vf-breadcrumb-item", index === items.length - 1 && "current")}>
              {item.label}
            </span>
          )}
          {index < items.length - 1 && (
            <ChevronRight className="vf-breadcrumb-separator h-4 w-4" />
          )}
        </React.Fragment>
      ))}
    </nav>
  );
})
VfBreadcrumb.displayName = "VfBreadcrumb"

export { VfBreadcrumb }