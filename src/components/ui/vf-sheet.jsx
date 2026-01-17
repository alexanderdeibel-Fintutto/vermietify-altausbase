import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const VfSheet = DialogPrimitive.Root

const VfSheetTrigger = DialogPrimitive.Trigger

const VfSheetClose = DialogPrimitive.Close

const VfSheetPortal = DialogPrimitive.Portal

const VfSheetOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    className={cn("fixed inset-0 z-50 vf-dialog-overlay", className)}
    {...props}
    ref={ref}
  />
))
VfSheetOverlay.displayName = "VfSheetOverlay"

const VfSheetContent = React.forwardRef(({ side = "right", className, children, ...props }, ref) => {
  const sideClass = side === "left" ? "vf-sheet-left" : "vf-sheet-right";
  const width = side === "left" || side === "right" ? "w-[400px]" : "h-[400px]";
  
  return (
    <VfSheetPortal>
      <VfSheetOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn("vf-sheet", sideClass, width, className)}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="vf-modal-close">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </VfSheetPortal>
  );
})
VfSheetContent.displayName = "VfSheetContent"

const VfSheetHeader = ({ className, ...props }) => (
  <div className={cn("vf-dialog-header", className)} {...props} />
)
VfSheetHeader.displayName = "VfSheetHeader"

const VfSheetFooter = ({ className, ...props }) => (
  <div className={cn("vf-dialog-footer", className)} {...props} />
)
VfSheetFooter.displayName = "VfSheetFooter"

const VfSheetTitle = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("vf-dialog-title", className)}
    {...props}
  />
))
VfSheetTitle.displayName = "VfSheetTitle"

const VfSheetDescription = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("vf-dialog-description", className)}
    {...props}
  />
))
VfSheetDescription.displayName = "VfSheetDescription"

const VfSheetBody = ({ className, ...props }) => (
  <div className={cn("vf-dialog-body", className)} {...props} />
)
VfSheetBody.displayName = "VfSheetBody"

export {
  VfSheet,
  VfSheetPortal,
  VfSheetOverlay,
  VfSheetTrigger,
  VfSheetClose,
  VfSheetContent,
  VfSheetHeader,
  VfSheetFooter,
  VfSheetTitle,
  VfSheetDescription,
  VfSheetBody,
}