import * as React from "react"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal } from "lucide-react"

const VfDataTable = React.forwardRef(({ 
  columns = [],
  data = [],
  sortBy,
  sortDirection = 'asc',
  onSort,
  selectable,
  selectedRows = [],
  onSelectRow,
  onSelectAll,
  onRowClick,
  className,
  ...props 
}, ref) => {
  const allSelected = selectable && data.length > 0 && selectedRows.length === data.length;
  const someSelected = selectable && selectedRows.length > 0 && selectedRows.length < data.length;

  return (
    <div className="vf-data-table-container">
      <table ref={ref} className={cn("vf-data-table", className)} {...props}>
        <thead>
          <tr>
            {selectable && (
              <th className="vf-data-table-cell-checkbox">
                <Checkbox 
                  checked={allSelected}
                  indeterminate={someSelected}
                  onCheckedChange={onSelectAll}
                />
              </th>
            )}
            {columns.map((column, index) => (
              <th
                key={index}
                className={cn(column.sortable && "th-sortable", sortBy === column.key && "th-sorted")}
                onClick={column.sortable ? () => onSort?.(column.key) : undefined}
              >
                {column.label}
                {column.sortable && sortBy === column.key && (
                  sortDirection === 'asc' ? 
                    <ArrowUp className="vf-data-table-sort-icon h-4 w-4 inline ml-1" /> : 
                    <ArrowDown className="vf-data-table-sort-icon h-4 w-4 inline ml-1" />
                )}
              </th>
            ))}
            <th className="vf-data-table-cell-actions"></th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (selectable ? 2 : 1)} className="vf-data-table-empty">
                Keine Daten verfügbar
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => {
              const isSelected = selectedRows.includes(row.id);
              
              return (
                <tr 
                  key={rowIndex}
                  className={cn(onRowClick && "vf-data-table-row-clickable")}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <td className="vf-data-table-cell-checkbox" onClick={(e) => e.stopPropagation()}>
                      <Checkbox 
                        checked={isSelected}
                        onCheckedChange={(checked) => onSelectRow?.(row.id, checked)}
                      />
                    </td>
                  )}
                  {columns.map((column, colIndex) => {
                    const value = row[column.key];
                    const cellClass = column.type === 'number' ? 'vf-data-table-cell-number' :
                                     column.type === 'currency' ? 'vf-data-table-cell-currency' :
                                     column.type === 'date' ? 'vf-data-table-cell-date' : '';

                    return (
                      <td key={colIndex} className={cellClass}>
                        {column.render ? column.render(value, row) : value}
                      </td>
                    );
                  })}
                  <td className="vf-data-table-cell-actions" onClick={(e) => e.stopPropagation()}>
                    <button className="p-2 hover:bg-[var(--theme-surface-hover)] rounded">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
})
VfDataTable.displayName = "VfDataTable"

export { VfDataTable }