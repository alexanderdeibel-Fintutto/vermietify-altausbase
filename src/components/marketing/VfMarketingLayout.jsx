import * as React from "react"
import { cn } from "@/lib/utils"
import { Link } from "react-router-dom"

const VfMarketingLayout = React.forwardRef(({ 
  navbar,
  children,
  footer,
  className,
  ...props 
}, ref) => {
  return (
    <div ref={ref} className={cn("min-h-screen", className)} {...props}>
      {navbar}
      <main className="pt-[72px]">{children}</main>
      {footer}
    </div>
  );
})
VfMarketingLayout.displayName = "VfMarketingLayout"

const VfMarketingNavbar = React.forwardRef(({ 
  logo,
  links = [],
  cta,
  className,
  ...props 
}, ref) => {
  return (
    <nav ref={ref} className={cn("vf-marketing-navbar", className)} {...props}>
      <div>{logo}</div>
      <div className="vf-marketing-navbar-links">
        {links.map((link, index) => (
          <a key={index} href={link.href} className="vf-marketing-navbar-link">
            {link.label}
          </a>
        ))}
        {cta}
      </div>
    </nav>
  );
})
VfMarketingNavbar.displayName = "VfMarketingNavbar"

const VfMarketingFooter = React.forwardRef(({ 
  logo,
  description,
  sections = [],
  copyright,
  className,
  ...props 
}, ref) => {
  return (
    <footer ref={ref} className={cn("vf-marketing-footer", className)} {...props}>
      <div className="vf-footer-grid">
        <div>
          <div className="vf-footer-logo">{logo}</div>
          <p className="vf-footer-description">{description}</p>
        </div>
        {sections.map((section, index) => (
          <div key={index}>
            <h4 className="vf-footer-heading">{section.title}</h4>
            <ul className="vf-footer-links">
              {section.links.map((link, i) => (
                <li key={i}>
                  <a href={link.href} className="vf-footer-link">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="vf-footer-bottom">
        <div>{copyright || `© ${new Date().getFullYear()} Vermitify. Alle Rechte vorbehalten.`}</div>
        <div className="flex gap-6">
          <a href="#" className="vf-footer-link">Datenschutz</a>
          <a href="#" className="vf-footer-link">AGB</a>
        </div>
      </div>
    </footer>
  );
})
VfMarketingFooter.displayName = "VfMarketingFooter"

export { VfMarketingLayout, VfMarketingNavbar, VfMarketingFooter }