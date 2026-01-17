import * as React from "react"
import { Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const VfDataField = React.forwardRef(({ 
  label,
  value,
  copyable,
  icon,
  className,
  ...props 
}, ref) => {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    if (!value) return
    await navigator.clipboard.writeText(String(value))
    setCopied(true)
    toast.success("In Zwischenablage kopiert")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div ref={ref} className={cn("vf-data-field", className)} {...props}>
      <div className="vf-data-field-label">{label}</div>
      <div className="vf-data-field-value">
        {icon}
        <span>{value || "—"}</span>
        {copyable && value && (
          <button 
            onClick={handleCopy}
            className="vf-data-field-copy"
            type="button"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
})
VfDataField.displayName = "VfDataField"

export { VfDataField }