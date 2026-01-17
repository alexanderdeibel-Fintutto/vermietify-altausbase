import * as React from "react"
import { cn } from "@/lib/utils"

const VfKeyValueList = React.forwardRef(({ 
  items = [],
  striped,
  className,
  ...props 
}, ref) => {
  return (
    <div 
      ref={ref} 
      className={cn("vf-kv-list", striped && "vf-kv-list-striped", className)} 
      {...props}
    >
      {items.map((item, index) => (
        <div key={index} className="vf-kv-item">
          <div className="vf-data-field-label">{item.label}</div>
          <div className="vf-data-field-value font-semibold">{item.value}</div>
        </div>
      ))}
    </div>
  );
})
VfKeyValueList.displayName = "VfKeyValueList"

export { VfKeyValueList }