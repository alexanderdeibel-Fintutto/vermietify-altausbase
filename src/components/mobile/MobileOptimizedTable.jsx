import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';

export default function MobileOptimizedTable({ data = [], columns = [], onRowClick }) {
  return (
    <div className="space-y-2">
      {data.map((row, index) => (
        <Card 
          key={index}
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onRowClick && onRowClick(row)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 space-y-1">
                {columns.map((col, colIndex) => (
                  <div key={colIndex}>
                    <span className="text-xs text-[var(--theme-text-muted)]">{col.label}: </span>
                    <span className="text-sm font-medium">{row[col.key]}</span>
                  </div>
                ))}
              </div>
              <ChevronRight className="h-5 w-5 text-[var(--theme-text-muted)] flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}