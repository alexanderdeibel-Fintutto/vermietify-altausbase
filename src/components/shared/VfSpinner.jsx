import React from 'react';
import { cn } from '@/lib/utils';

export function VfSpinner({ size = 'md', className }) {
  const sizeClasses = {
    xs: 'vf-spinner-xs',
    sm: 'vf-spinner-sm',
    md: 'vf-spinner-md',
    lg: 'vf-spinner-lg',
    xl: 'vf-spinner-xl'
  };

  return (
    <div className={cn("vf-spinner", sizeClasses[size], className)} />
  );
}