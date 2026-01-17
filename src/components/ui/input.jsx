import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, error, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn("vf-input", error && "vf-input-error", className)}
      ref={ref}
      {...props}
    />
  );
})
Input.displayName = "Input"

export { Input }