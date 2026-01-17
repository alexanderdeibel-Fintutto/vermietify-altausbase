import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VfCombobox } from '@/components/ui/vf-combobox';

export function VfSelect({
  label,
  options = [],
  value,
  onChange,
  placeholder,
  searchable = false,
  clearable = false,
  multiple = false,
  required = false,
  error,
  hint,
  ...props
}) {
  if (searchable) {
    return (
      <div className="space-y-1">
        {label && <Label required={required}>{label}</Label>}
        <VfCombobox
          options={options}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          clearable={clearable}
          {...props}
        />
        {hint && !error && <div className="vf-input-hint">{hint}</div>}
        {error && <div className="vf-input-error-message">{error}</div>}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {label && <Label required={required}>{label}</Label>}
      <Select value={value} onValueChange={onChange} {...props}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem 
              key={option.value} 
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hint && !error && <div className="vf-input-hint">{hint}</div>}
      {error && <div className="vf-input-error-message">{error}</div>}
    </div>
  );
}