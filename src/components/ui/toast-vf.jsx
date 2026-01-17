import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const VfToastContainer = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div ref={ref} className={cn("vf-toast-container", className)} {...props}>
      {children}
    </div>
  );
})
VfToastContainer.displayName = "VfToastContainer"

const VfToast = React.forwardRef(({ 
  variant = "info",
  icon,
  title,
  description,
  onClose,
  className,
  ...props 
}, ref) => {
  const variantClass = variant === "success" ? "vf-toast-success" :
                       variant === "error" ? "vf-toast-error" :
                       variant === "warning" ? "vf-toast-warning" : "vf-toast-info";

  return (
    <div ref={ref} className={cn("vf-toast", variantClass, className)} {...props}>
      {icon && <div className="flex-shrink-0">{icon}</div>}
      <div className="flex-1">
        {title && <div className="font-semibold mb-1">{title}</div>}
        {description && <div className="text-sm opacity-90">{description}</div>}
      </div>
      {onClose && (
        <button 
          onClick={onClose}
          className="flex-shrink-0 opacity-70 hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
})
VfToast.displayName = "VfToast"

export { VfToastContainer, VfToast }