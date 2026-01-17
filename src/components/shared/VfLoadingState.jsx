import React from 'react';
import { VfSkeleton } from './VfSkeleton';
import { VfSpinner } from './VfSpinner';

export function VfLoadingState({ type = 'spinner', text, lines = 3 }) {
  if (type === 'skeleton') {
    return (
      <div className="space-y-4 p-4">
        <VfSkeleton variant="title" />
        <VfSkeleton variant="text" lines={lines} />
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className="vf-card p-6">
        <VfSkeleton variant="title" className="mb-4" />
        <VfSkeleton variant="text" lines={4} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <VfSpinner size="lg" />
      {text && (
        <p className="mt-4 text-[var(--theme-text-muted)]">{text}</p>
      )}
    </div>
  );
}