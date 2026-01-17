import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const VfDialog = DialogPrimitive.Root

const VfDialogTrigger = DialogPrimitive.Trigger

const VfDialogPortal = DialogPrimitive.Portal

const VfDialogClose = DialogPrimitive.Close

const VfDialogOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 vf-dialog-overlay",
      className
    )}
    {...props}
  />
))
VfDialogOverlay.displayName = "VfDialogOverlay"

const VfDialogContent = React.forwardRef(({ className, children, size = "md", ...props }, ref) => {
  const sizeClass = size === "sm" ? "max-w-md" :
                    size === "lg" ? "max-w-3xl" :
                    size === "xl" ? "max-w-5xl" :
                    size === "full" ? "max-w-[95vw]" : "max-w-lg";
  
  return (
    <VfDialogPortal>
      <VfDialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] vf-dialog-content w-full",
          sizeClass,
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="vf-modal-close">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </VfDialogPortal>
  );
})
VfDialogContent.displayName = "VfDialogContent"

const VfDialogHeader = ({ className, ...props }) => (
  <div className={cn("vf-dialog-header", className)} {...props} />
)
VfDialogHeader.displayName = "VfDialogHeader"

const VfDialogFooter = ({ className, ...props }) => (
  <div className={cn("vf-dialog-footer", className)} {...props} />
)
VfDialogFooter.displayName = "VfDialogFooter"

const VfDialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("vf-dialog-title", className)}
    {...props}
  />
))
VfDialogTitle.displayName = "VfDialogTitle"

const VfDialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("vf-dialog-description", className)}
    {...props}
  />
))
VfDialogDescription.displayName = "VfDialogDescription"

const VfDialogBody = ({ className, ...props }) => (
  <div className={cn("vf-dialog-body", className)} {...props} />
)
VfDialogBody.displayName = "VfDialogBody"

export {
  VfDialog,
  VfDialogPortal,
  VfDialogOverlay,
  VfDialogClose,
  VfDialogTrigger,
  VfDialogContent,
  VfDialogHeader,
  VfDialogFooter,
  VfDialogTitle,
  VfDialogDescription,
  VfDialogBody,
}