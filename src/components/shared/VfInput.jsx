import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function VfInput({
  label,
  error,
  hint,
  required = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  leftAddon,
  rightAddon,
  className,
  ...props
}) {
  const hasAddons = leftAddon || rightAddon;

  return (
    <div className="space-y-1">
      {label && <Label required={required}>{label}</Label>}
      
      {hasAddons ? (
        <div className="vf-input-group">
          {leftAddon && <div className="vf-input-prefix">{leftAddon}</div>}
          {LeftIcon && <div className="vf-input-prefix"><LeftIcon className="h-4 w-4" /></div>}
          <Input error={error} className={className} {...props} />
          {rightAddon && <div className="vf-input-suffix">{rightAddon}</div>}
          {RightIcon && <div className="vf-input-suffix"><RightIcon className="h-4 w-4" /></div>}
        </div>
      ) : (
        <Input error={error} className={className} {...props} />
      )}
      
      {hint && !error && <div className="vf-input-hint">{hint}</div>}
      {error && <div className="vf-input-error-message">{error}</div>}
    </div>
  );
}