import React from 'react';
import { VfSpinner } from './VfSpinner';

export default function LoadingFallback({ message = 'Lädt...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <VfSpinner size="lg" />
      <p className="text-sm text-[var(--theme-text-muted)]">{message}</p>
    </div>
  );
}