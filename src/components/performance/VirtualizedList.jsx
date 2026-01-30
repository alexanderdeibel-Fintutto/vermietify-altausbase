import React, { useState, useRef, useEffect } from 'react';

export default function VirtualizedList({ 
  items = [], 
  itemHeight = 60, 
  containerHeight = 400,
  renderItem,
  overscan = 3
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.ceil((scrollTop + containerHeight) / itemHeight);

  const start = Math.max(0, visibleStart - overscan);
  const end = Math.min(items.length, visibleEnd + overscan);

  const visibleItems = items.slice(start, end);
  const offsetY = start * itemHeight;
  const totalHeight = items.length * itemHeight;

  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop);
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{ height: containerHeight, overflow: 'auto' }}
      className="relative"
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, idx) => (
            <div key={start + idx} style={{ height: itemHeight }}>
              {renderItem(item, start + idx)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}