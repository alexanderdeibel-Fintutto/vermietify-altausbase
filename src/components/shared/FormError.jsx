import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function FormError({ message }) {
  if (!message) return null;

  return (
    <div className="flex items-center gap-2 p-3 bg-[var(--vf-error-50)] text-[var(--vf-error-700)] rounded-lg text-sm">
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}