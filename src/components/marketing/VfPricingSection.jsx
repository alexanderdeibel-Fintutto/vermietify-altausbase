import * as React from "react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

const VfPricingSection = React.forwardRef(({ 
  title,
  description,
  plans = [],
  className,
  ...props 
}, ref) => {
  return (
    <section ref={ref} className={cn("vf-pricing", className)} {...props}>
      <div className="max-w-7xl mx-auto px-6">
        {(title || description) && (
          <div className="text-center mb-16">
            {title && <h2 className="text-3xl font-bold mb-4">{title}</h2>}
            {description && <p className="text-lg text-[var(--vf-neutral-600)]">{description}</p>}
          </div>
        )}
        <div className="vf-pricing-cards">
          {plans.map((plan, index) => (
            <div 
              key={index} 
              className={cn("vf-pricing-card", plan.highlighted && "vf-pricing-card-highlighted")}
            >
              <div className="vf-pricing-name">{plan.name}</div>
              <div className="my-4">
                <span className="vf-pricing-price">{plan.price}</span>
                {plan.period && <span className="vf-pricing-period">{plan.period}</span>}
              </div>
              {plan.features && (
                <ul className="vf-pricing-features">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="vf-pricing-feature">
                      <Check className="vf-pricing-feature-check h-5 w-5" />
                      {feature}
                    </li>
                  ))}
                </ul>
              )}
              {plan.cta && <div className="mt-6">{plan.cta}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
})
VfPricingSection.displayName = "VfPricingSection"

export { VfPricingSection }