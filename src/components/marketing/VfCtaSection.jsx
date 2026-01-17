import * as React from "react"
import { cn } from "@/lib/utils"

const VfCtaSection = React.forwardRef(({ 
  headline,
  subheadline,
  primaryCta,
  secondaryCta,
  gradient = false,
  className,
  ...props 
}, ref) => {
  return (
    <section 
      ref={ref} 
      className={cn("vf-cta-section", gradient && "vf-cta-section-gradient", className)} 
      {...props}
    >
      <div className="max-w-4xl mx-auto px-6">
        <h2 className="vf-cta-headline">{headline}</h2>
        {subheadline && <p className="vf-cta-subheadline">{subheadline}</p>}
        <div className="flex gap-4 justify-center">
          {primaryCta}
          {secondaryCta}
        </div>
      </div>
    </section>
  );
})
VfCtaSection.displayName = "VfCtaSection"

export { VfCtaSection }