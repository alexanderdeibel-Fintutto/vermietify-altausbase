import * as React from "react"
import { cn } from "@/lib/utils"

const InputGroup = React.forwardRef(({ 
  prefix,
  suffix,
  children,
  className,
  ...props 
}, ref) => {
  return (
    <div ref={ref} className={cn("vf-input-group", className)} {...props}>
      {prefix && <div className="vf-input-prefix">{prefix}</div>}
      {children}
      {suffix && <div className="vf-input-suffix">{suffix}</div>}
    </div>
  );
})
InputGroup.displayName = "InputGroup"

const CurrencyInput = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      type="number"
      step="0.01"
      className={cn("vf-input vf-currency-input", className)}
      {...props}
    />
  );
})
CurrencyInput.displayName = "CurrencyInput"

const InputHint = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <div ref={ref} className={cn("vf-input-hint", className)} {...props} />
  );
})
InputHint.displayName = "InputHint"

const InputError = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <div ref={ref} className={cn("vf-input-error-message", className)} {...props} />
  );
})
InputError.displayName = "InputError"

export { InputGroup, CurrencyInput, InputHint, InputError }