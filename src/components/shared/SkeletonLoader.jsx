import React from 'react';
import { VfSkeleton } from './VfSkeleton';

export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: columns }).map((_, j) => (
            <VfSkeleton key={j} className="h-12 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ count = 3 }) {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="vf-card p-6 space-y-3">
          <VfSkeleton className="h-6 w-24" />
          <VfSkeleton className="h-8 w-32" />
          <VfSkeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ count = 5 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <VfSkeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}