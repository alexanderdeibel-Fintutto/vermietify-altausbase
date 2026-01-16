import * as React from "react"
import { cn } from "@/lib/utils"

const PopoverContext = React.createContext({ open: false, setOpen: () => {} })

const Popover = ({ children }) => {
  const [open, setOpen] = React.useState(false)
  return (
    <PopoverContext.Provider value={{ open, setOpen }}>
      <div className="relative">{children}</div>
    </PopoverContext.Provider>
  )
}

const PopoverTrigger = React.forwardRef(({ className, children, asChild, ...props }, ref) => {
  const { open, setOpen } = React.useContext(PopoverContext)
  
  const child = asChild ? React.Children.only(children) : <button ref={ref} type="button" {...props}>{children}</button>
  
  return React.cloneElement(child, {
    onClick: (e) => {
      setOpen(!open)
      child.props?.onClick?.(e)
    }
  })
})
PopoverTrigger.displayName = "PopoverTrigger"

const PopoverContent = React.forwardRef(({ className, align = "center", sideOffset = 4, children, ...props }, ref) => {
  const { open, setOpen } = React.useContext(PopoverContext)
  const contentRef = React.useRef(null)

  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (contentRef.current && !contentRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open, setOpen])

  if (!open) return null

  return (
    <div
      ref={contentRef}
      className={cn(
        "absolute z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none animate-in fade-in-80 zoom-in-95",
        align === "start" && "left-0",
        align === "center" && "left-1/2 -translate-x-1/2",
        align === "end" && "right-0",
        className
      )}
      style={{ top: `calc(100% + ${sideOffset}px)` }}
      {...props}
    >
      {children}
    </div>
  )
})
PopoverContent.displayName = "PopoverContent"

export { Popover, PopoverTrigger, PopoverContent }