import * as React from "react"
import { cn } from "@/lib/utils"

const VfListPage = React.forwardRef(({ 
  header,
  filterBar,
  bulkActions,
  children,
  className,
  ...props 
}, ref) => {
  return (
    <div ref={ref} className={cn("vf-list-page", className)} {...props}>
      {header}
      {filterBar}
      {bulkActions}
      {children}
    </div>
  );
})
VfListPage.displayName = "VfListPage"

const VfListPageHeader = React.forwardRef(({ 
  title,
  description,
  actions,
  className,
  ...props 
}, ref) => {
  return (
    <div ref={ref} className={cn("vf-list-page-header", className)} {...props}>
      <div>
        <h1 className="vf-list-page-title">{title}</h1>
        {description && <p className="vf-list-page-description">{description}</p>}
      </div>
      {actions && <div className="flex gap-3">{actions}</div>}
    </div>
  );
})
VfListPageHeader.displayName = "VfListPageHeader"

export { VfListPage, VfListPageHeader }