import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { cn } from "@/lib/utils"

const VfPopover = PopoverPrimitive.Root

const VfPopoverTrigger = PopoverPrimitive.Trigger

const VfPopoverContent = React.forwardRef(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn("vf-popover p-4", className)}
      {...props}
    />
  </PopoverPrimitive.Portal>
))
VfPopoverContent.displayName = "VfPopoverContent"

export { VfPopover, VfPopoverTrigger, VfPopoverContent }