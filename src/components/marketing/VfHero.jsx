import * as React from "react"
import { cn } from "@/lib/utils"

const VfHero = React.forwardRef(({ 
  headline,
  subheadline,
  primaryCta,
  secondaryCta,
  gradient = true,
  className,
  ...props 
}, ref) => {
  return (
    <div 
      ref={ref} 
      className={cn("vf-hero", gradient && "vf-hero-gradient", className)} 
      {...props}
    >
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="vf-hero-headline">{headline}</h1>
        {subheadline && <p className="vf-hero-subheadline">{subheadline}</p>}
        {(primaryCta || secondaryCta) && (
          <div className="vf-hero-ctas">
            {primaryCta}
            {secondaryCta}
          </div>
        )}
      </div>
    </div>
  );
})
VfHero.displayName = "VfHero"

export { VfHero }