import React, { memo } from 'react';

const MemoizedComponent = memo(({ children, deps = [] }) => {
  return <>{children}</>;
}, (prevProps, nextProps) => {
  return JSON.stringify(prevProps.deps) === JSON.stringify(nextProps.deps);
});

MemoizedComponent.displayName = 'MemoizedComponent';

export default MemoizedComponent;