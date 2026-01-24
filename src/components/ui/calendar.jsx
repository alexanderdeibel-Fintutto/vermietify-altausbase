import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight } from "lucide-react"

const Calendar = React.forwardRef(({ className, ...props }, ref) => {
  const [month, setMonth] = React.useState(new Date())
  
  const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay()
  
  const days = Array.from({ length: daysInMonth(month) }, (_, i) => i + 1)
  const emptyDays = Array.from({ length: firstDay }, () => null)
  
  return (
    <div ref={ref} className={cn("p-3", className)}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1))}
            className="p-1 hover:bg-slate-100 rounded"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="text-sm font-medium">
            {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
          <button
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1))}
            className="p-1 hover:bg-slate-100 rounded"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-xs font-medium text-center text-slate-500 h-8 flex items-center justify-center">
              {day}
            </div>
          ))}
          {emptyDays.map((_, i) => <div key={`empty-${i}`} />)}
          {days.map(day => (
            <button
              key={day}
              className="h-8 rounded text-sm hover:bg-slate-100 flex items-center justify-center"
            >
              {day}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
})
Calendar.displayName = "Calendar"

export { Calendar }