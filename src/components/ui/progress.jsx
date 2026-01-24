import * as React from "react"
import { cn } from "@/lib/utils"

const Progress = React.forwardRef(({ className, value, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("w-full h-2 bg-gray-200 rounded-full overflow-hidden", className)}
    {...props}
  >
    <div
      className="h-full bg-blue-600 transition-all"
      style={{ width: `${value || 0}%` }}
    />
  </div>
))
Progress.displayName = "Progress"

export { Progress }