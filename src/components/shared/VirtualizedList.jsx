import React from 'react';

export default function VirtualizedList({ 
  items = [], 
  renderItem, 
  itemHeight = 60,
  containerHeight = 400 
}) {
  return (
    <div style={{ height: containerHeight, overflowY: 'auto' }}>
      {items.map((item, index) => (
        <div key={item.id || index} style={{ height: itemHeight }}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}