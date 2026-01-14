import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight } from 'lucide-react';

export default function CompactTable({ 
  data = [],
  columns = [],
  onRowClick,
  emptyMessage = "Keine Daten vorhanden"
}) {
  if (data.length === 0) {
    return (
      <Card>
        <div className="p-8 text-center text-slate-500">
          {emptyMessage}
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="text-left p-3 text-xs font-medium text-slate-700 uppercase tracking-wider"
                >
                  {col.label}
                </th>
              ))}
              {onRowClick && <th className="w-8"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, idx) => (
              <tr
                key={idx}
                onClick={() => onRowClick?.(row)}
                className={`${
                  onRowClick ? 'cursor-pointer hover:bg-slate-50' : ''
                } transition-colors`}
              >
                {columns.map((col) => (
                  <td key={col.key} className="p-3 text-sm text-slate-700">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
                {onRowClick && (
                  <td className="p-3">
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}