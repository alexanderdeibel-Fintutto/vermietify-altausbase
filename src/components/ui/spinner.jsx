import * as React from "react"
import { cn } from "@/lib/utils"

const Spinner = React.forwardRef(({ className, size = "md", ...props }, ref) => {
  const sizeClass = size === "xs" ? "vf-spinner-xs" :
                    size === "sm" ? "vf-spinner-sm" :
                    size === "lg" ? "vf-spinner-lg" :
                    size === "xl" ? "vf-spinner-xl" : "vf-spinner-md";
  
  return (
    <div
      ref={ref}
      className={cn("vf-spinner", sizeClass, className)}
      {...props}
    />
  );
})
Spinner.displayName = "Spinner"

export { Spinner }