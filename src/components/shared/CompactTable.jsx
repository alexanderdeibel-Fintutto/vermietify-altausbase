import React from 'react';
import { cn } from "@/lib/utils";
import { ChevronRight } from 'lucide-react';

export default function CompactTable({ 
  columns, 
  data, 
  onRowClick, 
  rowActions,
  accentColor = 'purple' 
}) {
  const colorMap = {
    purple: 'hover:bg-purple-50 border-purple-200',
    green: 'hover:bg-green-50 border-green-200',
    blue: 'hover:bg-blue-50 border-blue-200',
    orange: 'hover:bg-orange-50 border-orange-200',
  };

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            {columns.map(col => (
              <th 
                key={col.key}
                className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"
              >
                {col.label}
              </th>
            ))}
            {rowActions && <th className="px-6 py-3"></th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr 
              key={idx}
              onClick={() => onRowClick?.(row)}
              className={cn(
                "border-b border-slate-100 transition-colors cursor-pointer",
                colorMap[accentColor]
              )}
            >
              {columns.map(col => (
                <td 
                  key={col.key}
                  className="px-6 py-4 text-sm text-slate-700"
                >
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
              {rowActions && (
                <td className="px-6 py-4 text-right">
                  <div className="flex gap-2 justify-end">
                    {rowActions(row)}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}