import { useState, useEffect, useRef, useMemo } from 'react';

export function useVirtualizedTable(items = [], rowHeight = 50, overscan = 5) {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };

    const observer = new ResizeObserver((entries) => {
      setContainerHeight(entries[0].contentRect.height);
    });

    container.addEventListener('scroll', handleScroll);
    observer.observe(container);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  const { visibleItems, totalHeight, offsetY } = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / rowHeight) + overscan
    );

    return {
      visibleItems: items.slice(startIndex, endIndex + 1).map((item, idx) => ({
        ...item,
        index: startIndex + idx
      })),
      totalHeight: items.length * rowHeight,
      offsetY: startIndex * rowHeight
    };
  }, [items, scrollTop, containerHeight, rowHeight, overscan]);

  return {
    containerRef,
    visibleItems,
    totalHeight,
    offsetY
  };
}

export default useVirtualizedTable;