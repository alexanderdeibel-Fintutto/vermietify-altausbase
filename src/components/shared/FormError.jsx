import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function FormError({ message }) {
  if (!message) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-[var(--vf-error-600)] mt-2">
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}