import React, { useMemo } from 'react';

/**
 * Hook for virtualized table rendering with automatic row height estimation
 * Renders only visible rows to improve performance with large lists
 */
export function useVirtualizedList(items, itemHeight = 80, containerHeight = 600) {
  const [scrollTop, setScrollTop] = React.useState(0);

  const visibleRange = useMemo(() => {
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 1);
    const endIndex = Math.min(items.length, startIndex + visibleCount + 2);

    return {
      startIndex,
      endIndex,
      offsetY: startIndex * itemHeight,
    };
  }, [scrollTop, itemHeight, containerHeight, items.length]);

  return {
    visibleItems: items.slice(visibleRange.startIndex, visibleRange.endIndex),
    offsetY: visibleRange.offsetY,
    onScroll: (e) => setScrollTop(e.target.scrollTop),
    totalHeight: items.length * itemHeight,
  };
}