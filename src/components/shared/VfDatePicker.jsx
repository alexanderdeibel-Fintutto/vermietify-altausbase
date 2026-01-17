import React from 'react';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export function VfDatePicker({
  label,
  value,
  onChange,
  placeholder = 'Datum auswählen',
  required = false,
  error,
  hint,
  disabled = false,
  ...props
}) {
  return (
    <div className="space-y-1">
      {label && <Label required={required}>{label}</Label>}
      
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-[var(--theme-text-muted)]",
              error && "border-[var(--vf-error-500)]"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, 'dd.MM.yyyy', { locale: de }) : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={onChange}
            locale={de}
            {...props}
          />
        </PopoverContent>
      </Popover>
      
      {hint && !error && <div className="vf-input-hint">{hint}</div>}
      {error && <div className="vf-input-error-message">{error}</div>}
    </div>
  );
}