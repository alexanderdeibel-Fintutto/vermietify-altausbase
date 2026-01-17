import * as React from "react"
import { cn } from "@/lib/utils"

const VfSliderInput = React.forwardRef(({ 
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  formatValue,
  className,
  ...props 
}, ref) => {
  const percentage = ((value - min) / (max - min)) * 100;

  const handleChange = (e) => {
    onChange?.(Number(e.target.value));
  };

  const displayValue = formatValue ? formatValue(value) : value;

  return (
    <div ref={ref} className={cn("vf-slider-input", className)} {...props}>
      <div className="vf-slider-header">
        <span className="vf-slider-label">{label}</span>
        <span className="vf-slider-value">{displayValue}</span>
      </div>
      <div className="vf-slider-track">
        <div 
          className="vf-slider-fill" 
          style={{ width: `${percentage}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
        />
        <div 
          className="vf-slider-thumb" 
          style={{ left: `${percentage}%` }}
        />
      </div>
    </div>
  );
})
VfSliderInput.displayName = "VfSliderInput"

export { VfSliderInput }