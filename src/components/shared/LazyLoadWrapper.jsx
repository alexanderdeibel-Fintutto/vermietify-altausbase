import React, { Suspense } from 'react';
import SkeletonLoader from './SkeletonLoader';

export default function LazyLoadWrapper({ 
  component: Component, 
  fallback,
  skeletonType = 'card',
  ...props 
}) {
  const LoadingFallback = fallback || <SkeletonLoader type={skeletonType} />;

  return (
    <Suspense fallback={LoadingFallback}>
      <Component {...props} />
    </Suspense>
  );
}