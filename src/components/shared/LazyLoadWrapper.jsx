import React, { Suspense } from 'react';
import LoadingFallback from './LoadingFallback';

export default function LazyLoadWrapper({ children, fallback }) {
  return (
    <Suspense fallback={fallback || <LoadingFallback />}>
      {children}
    </Suspense>
  );
}