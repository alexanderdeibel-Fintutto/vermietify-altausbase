import React from 'react';

export default function AccessibilityHelper({ ariaLabel, ariaDescribedBy, children }) {
  return (
    <div 
      role="region"
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
    >
      {children}
    </div>
  );
}