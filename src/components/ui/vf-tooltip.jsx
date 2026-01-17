import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { cn } from "@/lib/utils"

const VfTooltipProvider = TooltipPrimitive.Provider

const VfTooltip = TooltipPrimitive.Root

const VfTooltipTrigger = TooltipPrimitive.Trigger

const VfTooltipContent = React.forwardRef(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn("vf-tooltip", className)}
    {...props}
  >
    {props.children}
    <TooltipPrimitive.Arrow className="vf-tooltip-arrow" />
  </TooltipPrimitive.Content>
))
VfTooltipContent.displayName = "VfTooltipContent"

export { VfTooltip, VfTooltipTrigger, VfTooltipContent, VfTooltipProvider }