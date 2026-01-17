import React, { Suspense } from 'react';
import LoadingSpinner from './LoadingSpinner';

export default function LazyLoadWrapper({ children, fallback }) {
  return (
    <Suspense fallback={fallback || <LoadingSpinner />}>
      {children}
    </Suspense>
  );
}