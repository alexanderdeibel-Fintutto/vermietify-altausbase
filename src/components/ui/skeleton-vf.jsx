import * as React from "react"
import { cn } from "@/lib/utils"

const VfSkeleton = React.forwardRef(({ 
  variant = "default",
  className,
  ...props 
}, ref) => {
  const variantClass = variant === "text" ? "vf-skeleton-text" :
                       variant === "title" ? "vf-skeleton-title" :
                       variant === "circular" ? "vf-skeleton-circular" : "";

  return (
    <div
      ref={ref}
      className={cn("vf-skeleton", variantClass, className)}
      {...props}
    />
  );
})
VfSkeleton.displayName = "VfSkeleton"

export { VfSkeleton }