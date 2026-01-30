import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function MobileOptimizedInput({ 
  label, 
  type = 'text', 
  value, 
  onChange, 
  placeholder,
  required = false,
  ...props 
}) {
  return (
    <div className="space-y-2">
      {label && (
        <Label className="text-base font-medium">
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </Label>
      )}
      <Input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="text-base min-h-[48px] px-4"
        {...props}
      />
    </div>
  );
}