import React from 'react';
import { Button } from '@/components/ui/button';

export default function AccessibleButton({ 
  children, 
  ariaLabel,
  keyboardShortcut,
  ...props 
}) {
  return (
    <Button
      aria-label={ariaLabel}
      title={keyboardShortcut ? `${ariaLabel} (${keyboardShortcut})` : ariaLabel}
      {...props}
    >
      {children}
    </Button>
  );
}