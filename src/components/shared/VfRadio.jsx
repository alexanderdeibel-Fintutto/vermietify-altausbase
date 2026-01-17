import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

export function VfRadio({ 
  label,
  options = [],
  value,
  onValueChange,
  error,
  hint,
  required = false,
  ...props 
}) {
  return (
    <div className="space-y-2">
      {label && <Label required={required}>{label}</Label>}
      
      <RadioGroup value={value} onValueChange={onValueChange} {...props}>
        {options.map((option) => (
          <div key={option.value} className="vf-radio-wrapper">
            <RadioGroupItem 
              value={option.value} 
              id={`radio-${option.value}`}
              disabled={option.disabled}
            />
            <Label 
              htmlFor={`radio-${option.value}`}
              className="vf-radio-label cursor-pointer"
            >
              {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
      
      {hint && !error && <div className="vf-input-hint">{hint}</div>}
      {error && <div className="vf-input-error-message">{error}</div>}
    </div>
  );
}