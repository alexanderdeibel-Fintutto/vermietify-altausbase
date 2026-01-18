import React from 'react';
import LoadingSpinner from './LoadingSpinner';

export default function LoadingFallback({ message = 'Laden...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <LoadingSpinner size="lg" />
      <p className="text-sm text-[var(--theme-text-muted)] mt-4">{message}</p>
    </div>
  );
}