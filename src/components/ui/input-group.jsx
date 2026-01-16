import React from 'react';
import { cn } from '@/lib/utils';

export const InputGroup = ({ children, className }) => (
  <div className={cn("vf-input-group", className)}>
    {children}
  </div>
);

export const InputPrefix = ({ children, className }) => (
  <div className={cn("vf-input-prefix", className)}>
    {children}
  </div>
);

export const InputSuffix = ({ children, className }) => (
  <div className={cn("vf-input-suffix", className)}>
    {children}
  </div>
);