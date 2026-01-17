import * as React from "react"
import { cn } from "@/lib/utils"

const VfDataGrid = React.forwardRef(({ 
  columns = 2,
  className,
  children,
  ...props 
}, ref) => {
  const columnClass = columns === 1 ? "vf-data-grid-1" :
                      columns === 3 ? "vf-data-grid-3" :
                      columns === 4 ? "vf-data-grid-4" : "vf-data-grid-2";

  return (
    <div 
      ref={ref} 
      className={cn("vf-data-grid", columnClass, className)} 
      {...props}
    >
      {children}
    </div>
  );
})
VfDataGrid.displayName = "VfDataGrid"

export { VfDataGrid }