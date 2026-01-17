import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export function VfTextarea({
  label,
  error,
  hint,
  required = false,
  rows = 4,
  maxLength,
  showCount = false,
  className,
  value,
  ...props
}) {
  const currentLength = value?.length || 0;

  return (
    <div className="space-y-1">
      {label && (
        <div className="flex justify-between items-center">
          <Label required={required}>{label}</Label>
          {showCount && maxLength && (
            <span className="text-xs text-[var(--theme-text-muted)]">
              {currentLength}/{maxLength}
            </span>
          )}
        </div>
      )}
      
      <Textarea
        rows={rows}
        maxLength={maxLength}
        value={value}
        className={cn(error && "vf-input-error", className)}
        {...props}
      />
      
      {hint && !error && <div className="vf-input-hint">{hint}</div>}
      {error && <div className="vf-input-error-message">{error}</div>}
    </div>
  );
}