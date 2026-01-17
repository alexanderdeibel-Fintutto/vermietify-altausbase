import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"

const VfTabs = TabsPrimitive.Root

const VfTabsList = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn("vf-tabs-list", className)}
    {...props}
  />
))
VfTabsList.displayName = "VfTabsList"

const VfTabsTrigger = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn("vf-tabs-trigger", className)}
    {...props}
  />
))
VfTabsTrigger.displayName = "VfTabsTrigger"

const VfTabsContent = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn("mt-6", className)}
    {...props}
  />
))
VfTabsContent.displayName = "VfTabsContent"

export { VfTabs, VfTabsList, VfTabsTrigger, VfTabsContent }