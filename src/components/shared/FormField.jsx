import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function FormField({
  label,
  error,
  hint,
  required = false,
  type = 'text',
  textarea = false,
  helperText,
  ...props
}) {
  const InputComponent = textarea ? Textarea : Input;
  const fieldId = props.id || `field-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={fieldId} className="flex items-center gap-1">
          {label}
          {required && <span className="text-red-600">*</span>}
          {hint && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 text-slate-400 hover:text-slate-600 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>{hint}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </Label>
      </div>

      <InputComponent
        id={fieldId}
        type={textarea ? undefined : type}
        aria-invalid={!!error}
        aria-describedby={error ? `${fieldId}-error` : helperText ? `${fieldId}-hint` : undefined}
        className={error ? 'border-red-500 focus:border-red-500' : ''}
        {...props}
      />

      {error && (
        <div id={`${fieldId}-error`} className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {helperText && !error && (
        <p id={`${fieldId}-hint`} className="text-xs text-slate-500">
          {helperText}
        </p>
      )}
    </div>
  );
}