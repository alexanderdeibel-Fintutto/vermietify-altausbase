import React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

const TabsVertical = TabsPrimitive.Root;

const TabsVerticalList = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn("flex flex-col gap-1", className)}
    {...props}
  />
));
TabsVerticalList.displayName = 'TabsVerticalList';

const TabsVerticalTrigger = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "vf-sidebar-item text-left",
      "data-[state=active]:vf-sidebar-item-active",
      className
    )}
    {...props}
  />
));
TabsVerticalTrigger.displayName = 'TabsVerticalTrigger';

const TabsVerticalContent = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn("flex-1", className)}
    {...props}
  />
));
TabsVerticalContent.displayName = 'TabsVerticalContent';

export { TabsVertical, TabsVerticalList, TabsVerticalTrigger, TabsVerticalContent };