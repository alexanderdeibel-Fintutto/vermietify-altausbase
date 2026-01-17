import * as React from "react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"

const VfMarketingNavbar = ({ logo, links = [], cta }) => {
  return (
    <nav className="vf-marketing-navbar">
      <div className="flex items-center gap-3">
        {logo}
      </div>
      <div className="vf-marketing-navbar-links">
        {links.map((link, index) => (
          <Link 
            key={index} 
            to={link.href} 
            className="vf-marketing-navbar-link"
          >
            {link.label}
          </Link>
        ))}
        {cta}
      </div>
    </nav>
  );
}

const VfMarketingFooter = ({ logo, description, sections = [] }) => {
  return (
    <footer className="vf-marketing-footer">
      <div className="vf-footer-grid">
        <div>
          {logo && <div className="vf-footer-logo">{logo}</div>}
          {description && <p className="vf-footer-description">{description}</p>}
        </div>
        {sections.map((section, index) => (
          <div key={index}>
            <h3 className="vf-footer-heading">{section.title}</h3>
            <ul className="vf-footer-links">
              {section.links?.map((link, idx) => (
                <li key={idx}>
                  <Link to={link.href} className="vf-footer-link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="vf-footer-bottom">
        <div>© 2026 Vermitify. Alle Rechte vorbehalten.</div>
        <div className="flex gap-6">
          <Link to="/datenschutz" className="vf-footer-link">Datenschutz</Link>
          <Link to="/impressum" className="vf-footer-link">Impressum</Link>
        </div>
      </div>
    </footer>
  );
}

const VfMarketingLayout = ({ children, navbar, footer }) => {
  return (
    <div className="min-h-screen flex flex-col">
      {navbar}
      <main className="flex-1 pt-[72px]">
        {children}
      </main>
      {footer}
    </div>
  );
}

export { VfMarketingLayout, VfMarketingNavbar, VfMarketingFooter }