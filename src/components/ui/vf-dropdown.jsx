import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { cn } from "@/lib/utils"

const VfDropdown = DropdownMenuPrimitive.Root

const VfDropdownTrigger = DropdownMenuPrimitive.Trigger

const VfDropdownGroup = DropdownMenuPrimitive.Group

const VfDropdownPortal = DropdownMenuPrimitive.Portal

const VfDropdownSub = DropdownMenuPrimitive.Sub

const VfDropdownRadioGroup = DropdownMenuPrimitive.RadioGroup

const VfDropdownContent = React.forwardRef(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn("vf-dropdown", className)}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
))
VfDropdownContent.displayName = "VfDropdownContent"

const VfDropdownItem = React.forwardRef(({ className, destructive, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn("vf-dropdown-item", destructive && "vf-dropdown-item-destructive", className)}
    {...props}
  />
))
VfDropdownItem.displayName = "VfDropdownItem"

const VfDropdownLabel = React.forwardRef(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn("vf-dropdown-label", className)}
    {...props}
  />
))
VfDropdownLabel.displayName = "VfDropdownLabel"

const VfDropdownSeparator = React.forwardRef(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("vf-dropdown-separator", className)}
    {...props}
  />
))
VfDropdownSeparator.displayName = "VfDropdownSeparator"

const VfDropdownShortcut = ({ className, ...props }) => {
  return (
    <span className={cn("vf-dropdown-shortcut", className)} {...props} />
  )
}
VfDropdownShortcut.displayName = "VfDropdownShortcut"

export {
  VfDropdown,
  VfDropdownTrigger,
  VfDropdownContent,
  VfDropdownItem,
  VfDropdownLabel,
  VfDropdownSeparator,
  VfDropdownShortcut,
  VfDropdownGroup,
  VfDropdownPortal,
  VfDropdownSub,
  VfDropdownRadioGroup,
}