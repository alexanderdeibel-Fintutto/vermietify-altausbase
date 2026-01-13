import React from 'react';
import { ChevronRight } from 'lucide-react';

export default function CompactTable({ 
  data = [],
  columns = [],
  onRowClick,
  rowKey = 'id'
}) {
  if (data.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {columns.map(col => (
              <th
                key={col.key}
                className="px-4 py-3 text-left font-semibold text-slate-700"
                style={{ width: col.width }}
              >
                {col.label}
              </th>
            ))}
            {onRowClick && <th className="px-4 py-3 w-8" />}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={row[rowKey] || idx}
              onClick={() => onRowClick?.(row)}
              className={`border-b border-slate-100 ${
                onRowClick ? 'hover:bg-slate-50 cursor-pointer' : ''
              }`}
            >
              {columns.map(col => (
                <td key={col.key} className="px-4 py-3 text-slate-900">
                  {col.format ? col.format(row[col.key], row) : row[col.key]}
                </td>
              ))}
              {onRowClick && (
                <td className="px-4 py-3">
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}