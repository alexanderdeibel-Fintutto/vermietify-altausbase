import * as React from "react"
import { cn } from "@/lib/utils"

const VfFeatureSection = React.forwardRef(({ 
  title,
  description,
  features = [],
  columns = 3,
  className,
  ...props 
}, ref) => {
  const gridClass = columns === 2 ? "vf-features-grid-2" :
                    columns === 3 ? "vf-features-grid-3" :
                    columns === 4 ? "vf-features-grid-4" : "vf-features-grid-3";

  return (
    <section ref={ref} className={cn("vf-features", className)} {...props}>
      <div className="max-w-6xl mx-auto px-6">
        {(title || description) && (
          <div className="text-center mb-16">
            {title && <h2 className="text-3xl font-bold mb-4">{title}</h2>}
            {description && <p className="text-lg text-[var(--vf-neutral-600)]">{description}</p>}
          </div>
        )}
        <div className={cn("vf-features-grid", gridClass)}>
          {features.map((feature, index) => (
            <div key={index} className="vf-feature-card">
              {feature.icon && <div className="vf-feature-icon">{feature.icon}</div>}
              <h3 className="vf-feature-title">{feature.title}</h3>
              <p className="vf-feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
})
VfFeatureSection.displayName = "VfFeatureSection"

export { VfFeatureSection }