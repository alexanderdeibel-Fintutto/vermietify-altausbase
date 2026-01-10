import React from 'react';
import { Button } from '@/components/ui/button';

/**
 * Accessible button with proper ARIA labels and keyboard support
 */
export const AccessibleButton = React.forwardRef((
  {
    children,
    ariaLabel,
    ariaDescribedBy,
    disabled,
    loading,
    onClick,
    ...props
  },
  ref
) => {
  return (
    <Button
      ref={ref}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-disabled={disabled || loading}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {children}
    </Button>
  );
});

AccessibleButton.displayName = 'AccessibleButton';

export default AccessibleButton;