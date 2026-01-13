import React from 'react';
import { ChevronRight } from 'lucide-react';

export default function CompactTable({
  columns = [],
  data = [],
  onRowClick,
  loading = false,
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, idx) => (
          <div key={idx} className="h-10 bg-slate-200 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="grid gap-px bg-slate-200">
        {/* Header */}
        <div
          className="grid gap-4 p-3 bg-slate-50 font-medium text-xs text-slate-700"
          style={{
            gridTemplateColumns: columns.map(c => c.width || '1fr').join(' '),
          }}
        >
          {columns.map((col, idx) => (
            <div key={idx}>{col.label}</div>
          ))}
        </div>

        {/* Rows */}
        {data.map((row, rowIdx) => (
          <div
            key={rowIdx}
            onClick={() => onRowClick?.(row)}
            className="grid gap-4 p-3 bg-white hover:bg-slate-50 cursor-pointer transition-colors group"
            style={{
              gridTemplateColumns: columns.map(c => c.width || '1fr').join(' '),
            }}
          >
            {columns.map((col, colIdx) => (
              <div
                key={colIdx}
                className="text-sm text-slate-700 flex items-center gap-2"
              >
                {col.render ? col.render(row[col.field], row) : row[col.field]}
              </div>
            ))}
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 ml-auto" />
          </div>
        ))}
      </div>

      {data.length === 0 && (
        <div className="p-8 text-center text-slate-500 text-sm">
          Keine Daten vorhanden
        </div>
      )}
    </div>
  );
}