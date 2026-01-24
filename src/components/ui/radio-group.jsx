
import * as React from "react"
import { cn } from "@/lib/utils"

const RadioGroup = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col gap-2", className)} role="radiogroup" {...props} />
))
RadioGroup.displayName = "RadioGroup"

const RadioGroupItem = React.forwardRef(({ className, ...props }, ref) => (
  <input
    type="radio"
    ref={ref}
    className={cn("w-4 h-4 accent-blue-600 cursor-pointer", className)}
    {...props}
  />
))
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }
