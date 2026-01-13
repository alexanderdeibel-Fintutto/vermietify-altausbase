import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function MobileOptimizedTable({ data = [], columns = [] }) {
  return (
    <div className="space-y-2 md:space-y-0">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              {columns.map(col => (
                <th key={col.key} className="text-left p-3 font-medium">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx} className="border-b hover:bg-slate-50">
                {columns.map(col => (
                  <td key={col.key} className="p-3">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-2">
        {data.map((row, idx) => (
          <Card key={idx}>
            <CardContent className="p-4 space-y-2">
              {columns.map(col => (
                <div key={col.key} className="flex justify-between items-center">
                  <span className="text-xs font-medium text-slate-600">
                    {col.label}
                  </span>
                  <span className="text-sm text-right">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}