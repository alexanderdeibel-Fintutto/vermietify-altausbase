import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { cn } from "@/lib/utils"

const VfCombobox = React.forwardRef(({ 
  options = [], 
  value, 
  onValueChange, 
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  className,
  disabled,
  ...props 
}, ref) => {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(search.toLowerCase())
  )

  const selectedOption = options.find(opt => opt.value === value)

  const handleSelect = (optionValue) => {
    onValueChange?.(optionValue === value ? "" : optionValue)
    setOpen(false)
    setSearch("")
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onValueChange?.("")
    setSearch("")
  }

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild disabled={disabled}>
        <button
          ref={ref}
          type="button"
          className={cn("vf-input vf-combobox-input relative", className)}
          {...props}
        >
          <span className={cn(!selectedOption && "text-[var(--theme-text-muted)]")}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {value && (
            <X 
              className="absolute right-8 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] vf-combobox-clear" 
              onClick={handleClear}
            />
          )}
          <ChevronsUpDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--theme-text-muted)]" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          className="vf-dropdown w-[var(--radix-popover-trigger-width)]"
          align="start"
        >
          <div className="p-2">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="vf-input mb-2"
            />
          </div>
          <div className="vf-combobox-options">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-[var(--theme-text-muted)]">
                {emptyText}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "vf-dropdown-item",
                    value === option.value && "vf-combobox-option-highlighted"
                  )}
                >
                  <Check
                    className={cn(
                      "h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </div>
              ))
            )}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
})
VfCombobox.displayName = "VfCombobox"

export { VfCombobox }