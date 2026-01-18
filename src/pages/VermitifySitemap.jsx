import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Building, Users, FileText, Calculator, Settings, HelpCircle } from 'lucide-react';

export default function VermitifySitemap() {
  const sections = [
    {
      title: 'Produkt',
      icon: Building,
      links: [
        { label: 'Startseite', page: 'VermitifyHomepage' },
        { label: 'Features', page: 'VermitifyFeatures' },
        { label: 'Preise', page: 'VermitifyPricing' },
        { label: 'Changelog', page: 'VermitifyChangelog' }
      ]
    },
    {
      title: 'Tools',
      icon: Calculator,
      links: [
        { label: 'Renditerechner', page: 'RenditeRechner' },
        { label: 'Indexmieten-Rechner', page: 'IndexmietenRechner' },
        { label: 'Mietvertrag-Generator', page: 'MietvertragGenerator' },
        { label: 'BK-Abrechnung', page: 'BKAbrechnungWizard' },
        { label: 'Anlage V', page: 'AnlageVWizard' }
      ]
    },
    {
      title: 'Verwaltung',
      icon: Users,
      links: [
        { label: 'Objekte', page: 'Buildings' },
        { label: 'Einheiten', page: 'UnitsManagement' },
        { label: 'Mieter', page: 'Tenants' },
        { label: 'Verträge', page: 'Contracts' },
        { label: 'Dokumente', page: 'Documents' }
      ]
    },
    {
      title: 'Finanzen',
      icon: FileText,
      links: [
        { label: 'Rechnungen', page: 'Invoices' },
        { label: 'Zahlungen', page: 'Payments' },
        { label: 'Bankkonten', page: 'BankAccounts' },
        { label: 'Betriebskosten', page: 'OperatingCosts' }
      ]
    },
    {
      title: 'Support',
      icon: HelpCircle,
      links: [
        { label: 'Hilfe-Center', page: 'HelpCenter' },
        { label: 'Support', page: 'VermitifySupport' },
        { label: 'FAQ', page: 'VermitifyFAQ' },
        { label: 'Kontakt', page: 'VermitifyContact' }
      ]
    },
    {
      title: 'Rechtliches',
      icon: Settings,
      links: [
        { label: 'AGB', page: 'VermitifyAGB' },
        { label: 'Datenschutz', page: 'VermitifyDatenschutz' },
        { label: 'Impressum', page: 'VermitifyImpressum' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[var(--theme-background)] py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4 vf-gradient-text">Sitemap</h1>
          <p className="text-lg text-[var(--theme-text-secondary)]">
            Alle Seiten und Funktionen auf einen Blick
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section) => (
            <Card key={section.title}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <section.icon className="h-5 w-5" />
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.page}>
                      <Link
                        to={createPageUrl(link.page)}
                        className="text-sm text-[var(--theme-text-secondary)] hover:text-[var(--theme-primary)]"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}