import React from 'react';
import { cn } from '@/lib/utils';

export const Spinner = ({ size = 'md', className }) => {
  const sizeClasses = {
    sm: 'vf-spinner-sm',
    md: '',
    lg: 'vf-spinner-lg'
  };

  return (
    <div className={cn("vf-spinner", sizeClasses[size], className)} />
  );
};

export default Spinner;