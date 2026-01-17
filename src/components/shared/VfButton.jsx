import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function VfButton({ 
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  children,
  className,
  ...props 
}) {
  return (
    <Button
      variant={variant}
      size={size}
      disabled={disabled || loading}
      className={cn(fullWidth && 'vf-btn-full', className)}
      {...props}
    >
      {loading && <div className="vf-spinner vf-spinner-sm mr-2" />}
      {!loading && Icon && iconPosition === 'left' && <Icon className="h-4 w-4 mr-2" />}
      {children}
      {!loading && Icon && iconPosition === 'right' && <Icon className="h-4 w-4 ml-2" />}
    </Button>
  );
}