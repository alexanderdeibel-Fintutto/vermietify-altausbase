import * as React from "react"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "vf-badge",
  {
    variants: {
      variant: {
        default: "vf-badge-default",
        primary: "vf-badge-primary",
        secondary: "vf-badge-default",
        accent: "vf-badge-accent",
        success: "vf-badge-success",
        warning: "vf-badge-warning",
        error: "vf-badge-error",
        destructive: "vf-badge-error",
        info: "vf-badge-info",
        gradient: "vf-badge-gradient",
        outline: "vf-badge-default",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}) {
  return (<div className={cn(badgeVariants({ variant }), className)} {...props} />);
}

export { Badge, badgeVariants }