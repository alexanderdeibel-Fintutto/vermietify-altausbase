import * as React from "react"
import { cn } from "@/lib/utils"

const RadioGroupContext = React.createContext({ value: "", onValueChange: () => {} })

const RadioGroup = React.forwardRef(({ className, value, onValueChange, defaultValue, children, ...props }, ref) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue || "")
  const currentValue = value !== undefined ? value : internalValue
  const handleValueChange = value !== undefined ? onValueChange : setInternalValue

  return (
    <RadioGroupContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      <div ref={ref} className={cn("grid gap-2", className)} role="radiogroup" {...props}>
        {children}
      </div>
    </RadioGroupContext.Provider>
  )
})
RadioGroup.displayName = "RadioGroup"

const RadioGroupItem = React.forwardRef(({ className, value, children, ...props }, ref) => {
  const { value: groupValue, onValueChange } = React.useContext(RadioGroupContext)
  const isChecked = groupValue === value

  return (
    <div className="flex items-center space-x-2">
      <button
        ref={ref}
        type="button"
        role="radio"
        aria-checked={isChecked}
        onClick={() => onValueChange(value)}
        className={cn(
          "aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      >
        {isChecked && (
          <div className="flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-primary" />
          </div>
        )}
      </button>
      {children}
    </div>
  )
})
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }