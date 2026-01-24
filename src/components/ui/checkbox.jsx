
import * as React from "react"
import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef(({ className, ...props }, ref) => (
  <input
    type="checkbox"
    ref={ref}
    className={cn("w-4 h-4 accent-blue-600 cursor-pointer", className)}
    {...props}
  />
))
Checkbox.displayName = "Checkbox"

export { Checkbox }
