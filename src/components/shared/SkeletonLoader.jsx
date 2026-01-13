import React from 'react';

export default function SkeletonLoader({ 
  count = 3,
  height = 'h-12',
  className = ''
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className={`${height} bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 rounded-lg animate-pulse`}
        />
      ))}
    </div>
  );
}