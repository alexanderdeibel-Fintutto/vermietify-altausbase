import React from 'react';
import { Button } from '@/components/ui/button';
import { Building, TrendingUp, FileText, Users, ArrowRight, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function VermitifyHomepageEnhanced() {
  return (
    <div className="min-h-screen bg-white">
      <div className="vf-marketing-navbar">
        <div className="flex items-center gap-3">
          <div className="text-2xl">🏠</div>
          <span className="font-light text-xl tracking-wider lowercase">vermitify</span>
        </div>
        <div className="vf-marketing-navbar-links">
          <Link to="/features" className="vf-marketing-navbar-link">Features</Link>
          <Link to="/pricing" className="vf-marketing-navbar-link">Preise</Link>
          <Link to="/tools-landing-page" className="vf-marketing-navbar-link">Tools</Link>
          <Link to="/contact" className="vf-marketing-navbar-link">Kontakt</Link>
          <Button variant="gradient" size="sm">Kostenlos starten</Button>
        </div>
      </div>

      <div className="vf-hero vf-hero-gradient">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="vf-hero-headline">
            Immobilien verwalten.<br />Steuern optimieren.<br />Zeit sparen.
          </h1>
          <p className="vf-hero-subheadline">
            Die All-in-One Plattform für Vermieter, Investoren und Hausverwaltungen.
            Automatisierte Betriebskostenabrechnungen, ELSTER-Integration und KI-gestützte Steueroptimierung.
          </p>
          <div className="vf-hero-ctas">
            <Button variant="gradient" size="lg">
              Jetzt kostenlos testen
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <Button variant="outline" size="lg">
              Demo ansehen
            </Button>
          </div>
        </div>
      </div>

      <div className="vf-features">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-center text-4xl font-bold mb-4">Alles, was Sie brauchen</h2>
          <p className="text-center text-xl text-[var(--vf-neutral-600)] mb-16 max-w-2xl mx-auto">
            Von der Objektverwaltung bis zur Steuererklärung – alles in einer Plattform
          </p>

          <div className="vf-features-grid vf-features-grid-4">
            <div className="vf-feature-card">
              <div className="vf-feature-icon">
                <Building className="h-7 w-7" />
              </div>
              <h3 className="vf-feature-title">Objektverwaltung</h3>
              <p className="vf-feature-description">
                Verwalten Sie alle Ihre Immobilien zentral. Einheiten, Mieter, Verträge – alles im Überblick.
              </p>
            </div>

            <div className="vf-feature-card">
              <div className="vf-feature-icon">
                <FileText className="h-7 w-7" />
              </div>
              <h3 className="vf-feature-title">Automatische Dokumente</h3>
              <p className="vf-feature-description">
                Mietverträge, Kündigungen, Nebenkostenabrechnungen – automatisch generiert und rechtssicher.
              </p>
            </div>

            <div className="vf-feature-card">
              <div className="vf-feature-icon">
                <TrendingUp className="h-7 w-7" />
              </div>
              <h3 className="vf-feature-title">Anlage V & ELSTER</h3>
              <p className="vf-feature-description">
                Automatische Anlage V Generierung mit direktem ELSTER-Export. Steuern waren nie einfacher.
              </p>
            </div>

            <div className="vf-feature-card">
              <div className="vf-feature-icon">
                <Users className="h-7 w-7" />
              </div>
              <h3 className="vf-feature-title">Mieter-Portal</h3>
              <p className="vf-feature-description">
                Ihre Mieter können Schäden melden, Dokumente einsehen und Zahlungen verfolgen – alles digital.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="vf-cta-section vf-cta-section-gradient">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="vf-cta-headline">Bereit zu starten?</h2>
          <p className="vf-cta-subheadline">14 Tage kostenlos testen. Keine Kreditkarte erforderlich.</p>
          <Button variant="accent" size="lg">
            Jetzt kostenlos starten
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </div>

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
            </ul>
          </div>
          <div>
            <h4 className="vf-footer-heading">Unternehmen</h4>
            <ul className="vf-footer-links">
              <li><Link to="/about-us" className="vf-footer-link">Über uns</Link></li>
              <li><Link to="/contact" className="vf-footer-link">Kontakt</Link></li>
              <li><Link to="/blog" className="vf-footer-link">Blog</Link></li>
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
    </div>
  );
}