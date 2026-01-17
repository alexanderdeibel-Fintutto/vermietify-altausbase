import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight } from "lucide-react"

const VfPagination = React.forwardRef(({ 
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  className,
  ...props 
}, ref) => {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    
    return pages;
  };

  return (
    <div ref={ref} className={cn("vf-pagination", className)} {...props}>
      <div className="vf-pagination-info">
        Zeige {startItem} bis {endItem} von {totalItems}
      </div>

      <div className="vf-pagination-controls">
        <button
          onClick={() => onPageChange?.(currentPage - 1)}
          disabled={currentPage === 1}
          className="vf-pagination-btn"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="vf-pagination-pages">
          {getPageNumbers().map((page, index) => (
            page === '...' ? (
              <span key={index} className="px-2">...</span>
            ) : (
              <button
                key={index}
                onClick={() => onPageChange?.(page)}
                className={cn(
                  "vf-pagination-page",
                  currentPage === page && "vf-pagination-page-active"
                )}
              >
                {page}
              </button>
            )
          ))}
        </div>

        <button
          onClick={() => onPageChange?.(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="vf-pagination-btn"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
            className="vf-pagination-size-select"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        )}
      </div>
    </div>
  );
})
VfPagination.displayName = "VfPagination"

export { VfPagination }