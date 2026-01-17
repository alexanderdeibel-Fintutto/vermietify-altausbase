import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

const VfPagination = React.forwardRef(({ 
  currentPage = 1,
  totalPages = 1,
  pageSize = 20,
  totalItems = 0,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  className,
  ...props 
}, ref) => {
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages)
      }
    }
    
    return pages
  }

  return (
    <div ref={ref} className={cn("vf-pagination", className)} {...props}>
      <div className="vf-pagination-info">
        Zeige {startItem}-{endItem} von {totalItems}
      </div>

      <div className="vf-pagination-controls">
        <button
          className="vf-pagination-btn"
          onClick={() => onPageChange?.(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="vf-pagination-pages">
          {getPageNumbers().map((page, index) => (
            page === "..." ? (
              <span key={index} className="vf-pagination-page">...</span>
            ) : (
              <button
                key={index}
                className={cn(
                  "vf-pagination-page",
                  currentPage === page && "vf-pagination-page-active"
                )}
                onClick={() => onPageChange?.(page)}
              >
                {page}
              </button>
            )
          ))}
        </div>

        <button
          className="vf-pagination-btn"
          onClick={() => onPageChange?.(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
            className="vf-pagination-size-select"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size} / Seite
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
})
VfPagination.displayName = "VfPagination"

export { VfPagination }