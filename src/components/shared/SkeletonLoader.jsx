import React from 'react';

export default function SkeletonLoader({ count = 3, height = 60 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="vf-skeleton"
          style={{ height: `${height}px` }}
        />
      ))}
    </div>
  );
}