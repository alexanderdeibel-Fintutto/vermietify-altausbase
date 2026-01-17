
import * as React from "react"
import { cn } from "@/lib/utils"

const Label = React.forwardRef(({ className, required, ...props }, ref) => (
  <label
    ref={ref}
    className={cn("vf-label", required && "vf-label-required", className)}
    {...props}
  />
))
Label.displayName = "Label"

export { Label }
