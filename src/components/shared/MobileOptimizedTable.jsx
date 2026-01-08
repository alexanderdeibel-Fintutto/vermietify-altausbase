import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Mobile-optimierte Tabelle
 * Desktop: Standard-Tabelle
 * Mobile: Karten-Layout
 */
export default function MobileOptimizedTable({ 
  data = [], 
  columns = [], 
  onRowClick,
  renderMobileCard,
  className 
}) {
  return (
    <>
      {/* Desktop: Tabelle */}
      <div className={cn("hidden md:block overflow-x-auto", className)}>
        <table className="w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className="px-4 py-3 text-left text-sm font-semibold text-slate-700"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((row, idx) => (
              <tr
                key={idx}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  "hover:bg-slate-50 transition-colors",
                  onRowClick && "cursor-pointer"
                )}
              >
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className="px-4 py-3 text-sm">
                    {col.cell ? col.cell(row) : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: Karten */}
      <div className="md:hidden space-y-3">
        {data.map((row, idx) => (
          <Card
            key={idx}
            onClick={() => onRowClick?.(row)}
            className={cn(
              "cursor-pointer hover:shadow-md transition-shadow",
              className
            )}
          >
            <CardContent className="p-4">
              {renderMobileCard ? (
                renderMobileCard(row)
              ) : (
                <div className="space-y-2">
                  {columns.map((col, colIdx) => (
                    <div key={colIdx}>
                      <div className="text-xs text-slate-600 font-medium">
                        {col.header}
                      </div>
                      <div className="text-sm">
                        {col.cell ? col.cell(row) : row[col.accessor]}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}