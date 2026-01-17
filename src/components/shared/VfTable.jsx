import React from 'react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { cn } from '@/lib/utils';

export function VfTable({ 
  columns = [],
  data = [],
  onRowClick,
  striped = false,
  compact = false,
  className 
}) {
  return (
    <div className="vf-table-container">
      <Table className={cn(
        "vf-table",
        striped && "vf-table-striped",
        compact && "vf-table-compact",
        className
      )}>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead 
                key={index}
                className={cn(
                  column.sortable && "sortable",
                  column.align === 'right' && "text-right",
                  column.align === 'center' && "text-center"
                )}
              >
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="vf-table-empty">
                Keine Daten vorhanden
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, rowIndex) => (
              <TableRow 
                key={rowIndex}
                onClick={() => onRowClick?.(row)}
                className={onRowClick ? 'cursor-pointer' : ''}
              >
                {columns.map((column, colIndex) => (
                  <TableCell 
                    key={colIndex}
                    className={cn(
                      column.type === 'number' && "vf-table-cell-number",
                      column.type === 'currency' && "vf-table-cell-currency",
                      column.type === 'date' && "vf-table-cell-date",
                      column.align === 'right' && "text-right",
                      column.align === 'center' && "text-center"
                    )}
                  >
                    {column.render ? column.render(row) : row[column.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}