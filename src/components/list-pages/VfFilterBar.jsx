import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"

const VfFilterBar = React.forwardRef(({ 
  searchValue,
  onSearchChange,
  searchPlaceholder = "Suchen...",
  filters,
  actions,
  activeFilters = [],
  onRemoveFilter,
  className,
  ...props 
}, ref) => {
  return (
    <>
      <div ref={ref} className={cn("vf-filter-bar", className)} {...props}>
        <div className="vf-filter-bar-search relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--theme-text-muted)]" />
          <Input
            type="search"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="pl-10"
          />
        </div>
        {filters && <div className="vf-filter-bar-filters">{filters}</div>}
        {actions && <div className="vf-filter-bar-actions">{actions}</div>}
      </div>

      {activeFilters.length > 0 && (
        <div className="vf-active-filters">
          {activeFilters.map((filter, index) => (
            <div key={index} className="vf-active-filter">
              {filter.label}
              <button 
                onClick={() => onRemoveFilter?.(filter)}
                className="vf-active-filter-remove"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
})
VfFilterBar.displayName = "VfFilterBar"

export { VfFilterBar }