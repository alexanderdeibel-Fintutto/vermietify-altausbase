import React from 'react';
import { Link } from 'react-router-dom';

export default function VfFooter() {
  return (
    <div className="vf-marketing-footer">
      <div className="vf-footer-grid">
        <div>
          <div className="vf-footer-logo text-2xl mb-4">🏠 vermitify</div>
          <p className="vf-footer-description">
            Die intelligente Plattform für Immobilienverwaltung und Steueroptimierung.
          </p>
        </div>
        <div>
          <h4 className="vf-footer-heading">Produkt</h4>
          <ul className="vf-footer-links">
            <li><Link to="/features" className="vf-footer-link">Features</Link></li>
            <li><Link to="/pricing" className="vf-footer-link">Preise</Link></li>
            <li><Link to="/tools-landing-page" className="vf-footer-link">Tools</Link></li>
            <li><Link to="/changelog" className="vf-footer-link">Changelog</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="vf-footer-heading">Ressourcen</h4>
          <ul className="vf-footer-links">
            <li><Link to="/blog" className="vf-footer-link">Blog</Link></li>
            <li><Link to="/help" className="vf-footer-link">Hilfe</Link></li>
            <li><Link to="/faq" className="vf-footer-link">FAQ</Link></li>
            <li><Link to="/testimonials" className="vf-footer-link">Testimonials</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="vf-footer-heading">Unternehmen</h4>
          <ul className="vf-footer-links">
            <li><Link to="/about-us" className="vf-footer-link">Über uns</Link></li>
            <li><Link to="/contact" className="vf-footer-link">Kontakt</Link></li>
            <li><Link to="/careers" className="vf-footer-link">Karriere</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="vf-footer-heading">Rechtliches</h4>
          <ul className="vf-footer-links">
            <li><Link to="/impressum" className="vf-footer-link">Impressum</Link></li>
            <li><Link to="/datenschutz" className="vf-footer-link">Datenschutz</Link></li>
            <li><Link to="/agb" className="vf-footer-link">AGB</Link></li>
          </ul>
        </div>
      </div>
      <div className="vf-footer-bottom">
        <div>© 2026 Vermitify. Alle Rechte vorbehalten.</div>
        <div>Made with ❤️ in Germany</div>
      </div>
    </div>
  );
}