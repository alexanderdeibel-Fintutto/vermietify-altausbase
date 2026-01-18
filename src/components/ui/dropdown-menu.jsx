import * as React from "react"
import { Check, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

const DropdownMenuContext = React.createContext({ open: false, setOpen: () => {} })

const DropdownMenu = ({ children, open, onOpenChange }) => {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isOpen = open !== undefined ? open : internalOpen
  const setIsOpen = onOpenChange || setInternalOpen

  return (
    <DropdownMenuContext.Provider value={{ open: isOpen, setOpen: setIsOpen }}>
      <div className="relative inline-block">{children}</div>
    </DropdownMenuContext.Provider>
  )
}

const DropdownMenuTrigger = React.forwardRef(({ className, children, asChild, ...props }, ref) => {
  const { open, setOpen } = React.useContext(DropdownMenuContext)
  
  if (asChild) {
    return React.cloneElement(React.Children.only(children), {
      onClick: (e) => {
        setOpen(!open)
        children.props?.onClick?.(e)
      }
    })
  }

  return (
    <button
      ref={ref}
      onClick={() => setOpen(!open)}
      className={className}
      {...props}
    >
      {children}
    </button>
  )
})
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

const DropdownMenuContent = React.forwardRef(({ className, sideOffset = 4, children, ...props }, ref) => {
  const { open, setOpen } = React.useContext(DropdownMenuContext)
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
      className={cn("vf-dropdown", className)}
      style={{ marginTop: `${sideOffset}px` }}
      {...props}
    >
      {children}
    </div>
  )
})
DropdownMenuContent.displayName = "DropdownMenuContent"

const DropdownMenuItem = React.forwardRef(({ className, inset, onClick, ...props }, ref) => {
  const { setOpen } = React.useContext(DropdownMenuContext)
  
  return (
    <div
      ref={ref}
      onClick={(e) => {
        onClick?.(e)
        setOpen(false)
      }}
      className={cn("vf-dropdown-item", inset && "pl-8", className)}
      {...props}
    />
  )
})
DropdownMenuItem.displayName = "DropdownMenuItem"

const DropdownMenuCheckboxItem = React.forwardRef(({ className, children, checked, onCheckedChange, ...props }, ref) => {
  const { setOpen } = React.useContext(DropdownMenuContext)
  
  return (
    <div
      ref={ref}
      onClick={() => {
        onCheckedChange?.(!checked)
      }}
      className={cn("vf-dropdown-item relative pl-8", className)}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {checked && <Check className="h-4 w-4" />}
      </span>
      {children}
    </div>
  )
})
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem"

const DropdownMenuRadioItem = React.forwardRef(({ className, children, value, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("vf-dropdown-item relative pl-8", className)}
    {...props}
  >
    {children}
  </div>
))
DropdownMenuRadioItem.displayName = "DropdownMenuRadioItem"

const DropdownMenuLabel = React.forwardRef(({ className, inset, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("vf-dropdown-label", inset && "pl-8", className)}
    {...props}
  />
))
DropdownMenuLabel.displayName = "DropdownMenuLabel"

const DropdownMenuSeparator = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("vf-dropdown-separator", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = "DropdownMenuSeparator"

const DropdownMenuShortcut = ({ className, ...props }) => {
  return <span className={cn("vf-dropdown-shortcut", className)} {...props} />
}
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"

const DropdownMenuGroup = ({ children }) => <>{children}</>
const DropdownMenuPortal = ({ children }) => <>{children}</>
const DropdownMenuSub = ({ children }) => <>{children}</>
const DropdownMenuSubContent = ({ children, className }) => <div className={className}>{children}</div>
const DropdownMenuSubTrigger = ({ children, className }) => <div className={cn("vf-dropdown-item", className)}>{children} <ChevronRight className="ml-auto h-4 w-4" /></div>
const DropdownMenuRadioGroup = ({ children }) => <>{children}</>

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
}