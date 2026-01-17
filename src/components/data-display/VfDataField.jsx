import * as React from "react"
import { cn } from "@/lib/utils"
import { Copy, Check } from "lucide-react"

const VfDataField = React.forwardRef(({ 
  label,
  value,
  icon,
  copyable,
  className,
  ...props 
}, ref) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div ref={ref} className={cn("vf-data-field", className)} {...props}>
      <div className="vf-data-field-label">{label}</div>
      <div className="vf-data-field-value">
        {icon}
        {value}
        {copyable && (
          <button onClick={handleCopy} className="vf-data-field-copy">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
})
VfDataField.displayName = "VfDataField"

export { VfDataField }