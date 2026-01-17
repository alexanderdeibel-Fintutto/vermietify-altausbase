import * as React from "react"
import { cn } from "@/lib/utils"

const Textarea = React.forwardRef(({ className, error, ...props }, ref) => {
  return (
    <textarea
      className={cn("vf-textarea", error && "vf-input-error", className)}
      ref={ref}
      {...props}
    />
  );
})
Textarea.displayName = "Textarea"

export { Textarea }