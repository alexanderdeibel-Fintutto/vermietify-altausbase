import React from 'react';
import { VfInput } from '@/components/shared/VfInput';

export default function MobileOptimizedInput({ ...props }) {
  return (
    <VfInput
      {...props}
      className="h-12 text-base"
      style={{ fontSize: '16px' }}
    />
  );
}