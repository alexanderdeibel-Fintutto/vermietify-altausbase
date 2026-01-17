import * as React from "react"
import { cn } from "@/lib/utils"

const VfTestimonialsSection = React.forwardRef(({ 
  title,
  testimonials = [],
  className,
  ...props 
}, ref) => {
  return (
    <section ref={ref} className={cn("vf-testimonials", className)} {...props}>
      <div className="max-w-6xl mx-auto px-6">
        {title && <h2 className="text-center text-3xl font-bold mb-12">{title}</h2>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="vf-testimonial-card">
              <p className="vf-testimonial-quote">"{testimonial.quote}"</p>
              <div className="vf-testimonial-author">
                {testimonial.avatar && (
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.name}
                    className="vf-testimonial-avatar"
                  />
                )}
                <div>
                  <div className="vf-testimonial-author-name">{testimonial.name}</div>
                  {testimonial.role && (
                    <div className="vf-testimonial-author-role">{testimonial.role}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
})
VfTestimonialsSection.displayName = "VfTestimonialsSection"

export { VfTestimonialsSection }