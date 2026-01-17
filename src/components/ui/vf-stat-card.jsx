import * as React from "react"
import { cn } from "@/lib/utils"

const VfStatCard = React.forwardRef(({ 
  label,
  value,
  icon,
  trend,
  trendValue,
  highlighted,
  className,
  ...props 
}, ref) => {
  const trendType = trend === "up" ? "positive" : trend === "down" ? "negative" : "neutral";

  return (
    <div 
      ref={ref} 
      className={cn("vf-stat-card", highlighted && "vf-stat-card-highlighted", className)} 
      {...props}
    >
      <div className="vf-stat-card-header">
        <span className="vf-stat-card-label">{label}</span>
        {icon && <div className="vf-stat-card-icon">{icon}</div>}
      </div>
      <div className="vf-stat-card-value">{value}</div>
      {trendValue && (
        <div className={cn("vf-stat-card-trend", trendType)}>
          {trendValue}
        </div>
      )}
    </div>
  );
})
VfStatCard.displayName = "VfStatCard"

export { VfStatCard }