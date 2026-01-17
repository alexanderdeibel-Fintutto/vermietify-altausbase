import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const VfPricingSection = React.forwardRef(({ 
  title,
  description,
  plans = [],
  className,
  ...props 
}, ref) => {
  return (
    <section ref={ref} className={cn("vf-pricing", className)} {...props}>
      <div className="max-w-6xl mx-auto px-6">
        {title && <h2 className="text-center text-3xl font-bold mb-4">{title}</h2>}
        {description && <p className="text-center text-lg text-[var(--vf-neutral-600)] mb-12">{description}</p>}
        <div className="vf-pricing-cards">
          {plans.map((plan, index) => (
            <div 
              key={index} 
              className={cn("vf-pricing-card", plan.highlighted && "vf-pricing-card-highlighted")}
            >
              <div className="vf-pricing-name">{plan.name}</div>
              <div className="flex items-baseline mb-6">
                <span className="vf-pricing-price">{plan.price}</span>
                <span className="vf-pricing-period ml-2">{plan.period}</span>
              </div>
              <ul className="vf-pricing-features">
                {plan.features?.map((feature, idx) => (
                  <li key={idx} className="vf-pricing-feature">
                    <Check className="vf-pricing-feature-check h-5 w-5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              {plan.cta}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
})
VfPricingSection.displayName = "VfPricingSection"

export { VfPricingSection }