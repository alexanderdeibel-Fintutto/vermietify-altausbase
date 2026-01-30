import React from 'react';
import { Button } from '@/components/ui/button';

export default function AccessibleButton({
  children,
  ariaLabel,
  ariaPressed,
  ariaDescribedBy,
  disabled,
  onClick,
  variant = 'default',
  ...props
}) {
  return (
    <Button
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      aria-describedby={ariaDescribedBy}
      disabled={disabled}
      onClick={onClick}
      variant={variant}
      {...props}
    >
      {children}
    </Button>
  );
}