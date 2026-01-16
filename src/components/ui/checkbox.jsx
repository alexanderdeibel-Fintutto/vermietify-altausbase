import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef(({ className, checked, onCheckedChange, ...props }, ref) => {
  const [isChecked, setIsChecked] = React.useState(checked || false)
  
  React.useEffect(() => {
    if (checked !== undefined) setIsChecked(checked)
  }, [checked])

  const handleChange = (e) => {
    const newChecked = e.target.checked
    setIsChecked(newChecked)
    if (onCheckedChange) onCheckedChange(newChecked)
  }

  return (
    <div className="relative inline-flex items-center">
      <input
        type="checkbox"
        ref={ref}
        checked={isChecked}
        onChange={handleChange}
        className="sr-only peer"
        {...props}
      />
      <div
        className={cn(
          "h-4 w-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 peer-checked:bg-primary peer-checked:text-primary-foreground flex items-center justify-center",
          className
        )}
      >
        {isChecked && <Check className="h-3 w-3" />}
      </div>
    </div>
  )
})
Checkbox.displayName = "Checkbox"

export { Checkbox }