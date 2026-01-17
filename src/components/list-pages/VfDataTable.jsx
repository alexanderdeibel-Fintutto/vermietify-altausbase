import * as React from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"

const VfDataTable = React.forwardRef(({ 
  columns = [],
  data = [],
  sortBy,
  sortDirection,
  onSort,
  selectable,
  selectedRows = [],
  onSelectRow,
  onSelectAll,
  onRowClick,
  emptyState,
  loading,
  className,
  ...props 
}, ref) => {
  const allSelected = data.length > 0 && selectedRows.length === data.length

  return (
    <div ref={ref} className={cn("vf-data-table-container", className)} {...props}>
      <table className="vf-data-table">
        <thead>
          <tr>
            {selectable && (
              <th className="vf-data-table-cell-checkbox">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(checked) => onSelectAll?.(checked)}
                />
              </th>
            )}
            {columns.map((column, index) => (
              <th
                key={index}
                className={cn(
                  column.sortable && "vf-data-table-th-sortable",
                  sortBy === column.key && "vf-data-table-th-sorted"
                )}
                onClick={() => column.sortable && onSort?.(column.key)}
              >
                <div className="flex items-center gap-1">
                  {column.label}
                  {column.sortable && sortBy === column.key && (
                    <span className="vf-data-table-sort-icon">
                      {sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)} className="vf-table-empty">
                {emptyState || "Keine Daten verfügbar"}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={cn(onRowClick && "vf-data-table-row-clickable")}
                onClick={() => onRowClick?.(row)}
              >
                {selectable && (
                  <td className="vf-data-table-cell-checkbox">
                    <Checkbox
                      checked={selectedRows.includes(row.id || rowIndex)}
                      onCheckedChange={(checked) => onSelectRow?.(row.id || rowIndex, checked)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                )}
                {columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className={cn(
                      column.type === "number" && "vf-data-table-cell-number",
                      column.type === "currency" && "vf-data-table-cell-currency",
                      column.type === "date" && "vf-data-table-cell-date",
                      column.type === "actions" && "vf-data-table-cell-actions"
                    )}
                  >
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
})
VfDataTable.displayName = "VfDataTable"

export { VfDataTable }