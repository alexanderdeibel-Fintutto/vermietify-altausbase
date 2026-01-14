import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function MobileOptimizedInput({ 
  type = 'text',
  multiline = false,
  ...props 
}) {
  const Component = multiline ? Textarea : Input;
  
  // Add mobile-optimized attributes
  const mobileProps = {
    ...props,
    autoComplete: props.autoComplete || 'off',
    autoCapitalize: props.autoCapitalize || 'sentences',
    spellCheck: props.spellCheck ?? true,
    // Increase tap target size on mobile
    className: `${props.className || ''} min-h-[44px] text-base`,
  };

  // Mobile-specific input types
  if (type === 'email') {
    mobileProps.inputMode = 'email';
    mobileProps.type = 'email';
  } else if (type === 'tel') {
    mobileProps.inputMode = 'tel';
    mobileProps.type = 'tel';
  } else if (type === 'number') {
    mobileProps.inputMode = 'decimal';
    mobileProps.type = 'text'; // Prevent spinner on mobile
    mobileProps.pattern = '[0-9]*';
  } else if (type === 'date') {
    mobileProps.type = 'date';
  }

  return <Component {...mobileProps} />;
}

export default MobileOptimizedInput;