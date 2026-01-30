import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function FormField({
  label,
  error,
  required,
  helpText,
  children,
  className
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </Label>
      )}
      {children}
      {helpText && !error && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{helpText}</p>
      )}
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}