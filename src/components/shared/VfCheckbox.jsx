import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export function VfCheckbox({ 
  label, 
  description,
  checked, 
  onCheckedChange,
  disabled = false,
  id,
  ...props 
}) {
  const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="vf-checkbox-wrapper">
      <Checkbox 
        id={checkboxId}
        checked={checked} 
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        {...props}
      />
      <div className="flex flex-col">
        <Label 
          htmlFor={checkboxId}
          className="vf-checkbox-label cursor-pointer"
        >
          {label}
        </Label>
        {description && (
          <p className="text-xs text-[var(--theme-text-muted)] mt-0.5">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}