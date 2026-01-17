import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { VfMarketingLayout } from '@/components/marketing/VfMarketingLayout';

export default function VermitifySitemap() {
  const sections = [
    {
      title: 'Produkt',
      links: [
        { label: 'Features', href: 'VermitifyFeatures' },
        { label: 'Preise', href: 'VermitifyPricing' },
        { label: 'Roadmap', href: 'VermitifyRoadmap' },
        { label: 'Changelog', href: 'VermitifyChangelog' }
      ]
    },
    {
      title: 'Kostenlose Tools',
      links: [
        { label: 'Alle Tools', href: 'VermitifyToolsOverview' },
        { label: 'Rendite-Rechner', href: 'RenditeRechner' },
        { label: 'Indexmieten-Rechner', href: 'IndexmietenRechner' },
        { label: 'AfA-Rechner', href: 'AfACalculator' },
        { label: 'Cashflow-Rechner', href: 'CashflowRechner' },
        { label: 'Tilgungs-Rechner', href: 'TilgungsRechner' },
        { label: 'Kaufpreis-Rechner', href: 'KaufpreisRechner' },
        { label: 'Mietvertrag-Generator', href: 'MietvertragGenerator' },
        { label: 'BK-Checker', href: 'BKChecker' }
      ]
    },
    {
      title: 'Unternehmen',
      links: [
        { label: 'Über uns', href: 'VermitifyAboutUs' },
        { label: 'Erfolgsgeschichten', href: 'VermitifyCaseStudies' },
        { label: 'Partner', href: 'VermitifyPartners' },
        { label: 'Blog', href: 'VermitifyBlog' }
      ]
    },
    {
      title: 'Support',
      links: [
        { label: 'Hilfe-Center', href: 'VermitifyHelp' },
        { label: 'FAQ', href: 'VermitifyFAQ' },
        { label: 'Kontakt', href: 'VermitifyContact' }
      ]
    },
    {
      title: 'Rechtliches',
      links: [
        { label: 'Impressum', href: 'VermitifyImpressum' },
        { label: 'Datenschutz', href: 'VermitifyDatenschutz' },
        { label: 'AGB', href: 'VermitifyAGB' }
      ]
    }
  ];

  return (
    <VfMarketingLayout>
      <div className="max-w-6xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold mb-12">Sitemap</h1>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="text-lg font-semibold mb-4 text-[var(--vf-primary-600)]">
                {section.title}
              </h2>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link 
                      to={createPageUrl(link.href)}
                      className="text-[var(--theme-text-secondary)] hover:text-[var(--theme-primary)] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </VfMarketingLayout>
  );
}