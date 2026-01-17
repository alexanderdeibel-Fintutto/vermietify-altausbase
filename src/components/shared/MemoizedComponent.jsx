
import React, { memo } from 'react';

// Generic memoized wrapper for expensive components
export function withMemoization(Component, arePropsEqual) {
  return memo(Component, arePropsEqual);
}

// Common comparison functions
export const shallowEqual = (prevProps, nextProps) => {
  const keys1 = Object.keys(prevProps);
  const keys2 = Object.keys(nextProps);
  
  if (keys1.length !== keys2.length) return false;
  
  return keys1.every(key => prevProps[key] === nextProps[key]);
};

export const deepEqual = (prevProps, nextProps) => {
  return JSON.stringify(prevProps) === JSON.stringify(nextProps);
};

// Memoized list item component
export const MemoizedListItem = memo(({ item, onSelect, renderItem }) => {
  return (
    <div onClick={() => onSelect(item)}>
      {renderItem(item)}
    </div>
  );
}, (prev, next) => prev.item.id === next.item.id);

export const MemoizedCard = React.memo(({ title, children }) => (
  <div className="vf-card p-6">
    <h3 className="vf-card-title mb-4">{title}</h3>
    {children}
  </div>
));

MemoizedCard.displayName = 'MemoizedCard';

export default { withMemoization, MemoizedListItem, shallowEqual, deepEqual, MemoizedCard };
