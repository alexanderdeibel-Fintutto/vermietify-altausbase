import React from 'react';

export default function MobileOptimizedTable({ items = [], renderItem }) {
  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={item.id || index} className="bg-white border border-[var(--theme-border)] rounded-lg p-4">
          {renderItem(item)}
        </div>
      ))}
    </div>
  );
}