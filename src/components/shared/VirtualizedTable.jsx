import React from 'react';
import { useVirtualizedTable } from '@/components/hooks/useVirtualizedTable';

export default function VirtualizedTable({ 
  data = [], 
  columns = [],
  rowHeight = 50,
  onRowClick 
}) {
  const { containerRef, visibleItems, totalHeight, offsetY } = useVirtualizedTable(
    data, 
    rowHeight
  );

  return (
    <div 
      ref={containerRef}
      className="relative overflow-auto border border-slate-200 rounded-lg"
      style={{ height: '600px' }}
    >
      {/* Spacer for total height */}
      <div style={{ height: totalHeight }}>
        {/* Header */}
        <div 
          className="sticky top-0 z-10 bg-white border-b border-slate-200 flex font-semibold text-sm"
          style={{ height: rowHeight }}
        >
          {columns.map((col) => (
            <div
              key={col.key}
              className="flex items-center px-4 text-slate-700"
              style={{ width: col.width || `${100 / columns.length}%` }}
            >
              {col.label}
            </div>
          ))}
        </div>

        {/* Visible rows */}
        <div 
          className="relative"
          style={{ transform: `translateY(${offsetY}px)` }}
        >
          {visibleItems.map((item) => (
            <div
              key={item.id || item.index}
              className="flex border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
              style={{ height: rowHeight }}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((col) => (
                <div
                  key={col.key}
                  className="flex items-center px-4 text-sm text-slate-600"
                  style={{ width: col.width || `${100 / columns.length}%` }}
                >
                  {col.render ? col.render(item[col.key], item) : item[col.key]}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}