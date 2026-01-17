import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export function VfSwitch({ 
  label,
  description,
  checked, 
  onCheckedChange,
  disabled = false,
  id,
  ...props 
}) {
  const switchId = id || `switch-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1">
        <Label 
          htmlFor={switchId}
          className="cursor-pointer font-medium"
        >
          {label}
        </Label>
        {description && (
          <p className="text-sm text-[var(--theme-text-muted)] mt-0.5">
            {description}
          </p>
        )}
      </div>
      <Switch 
        id={switchId}
        checked={checked} 
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        {...props}
      />
    </div>
  );
}