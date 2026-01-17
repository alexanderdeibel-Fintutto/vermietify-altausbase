import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Palette, Layout, Code, Layers } from 'lucide-react';
import VermitifyThemeSelector from '@/components/theme/VermitifyThemeSelector';

export default function VermitifyDesignShowcase() {
  const showcasePages = [
    {
      title: "Design System",
      description: "Alle Komponenten und deren Varianten",
      icon: Palette,
      page: "DesignSystemShowcase",
      badge: "Vollständig"
    },
    {
      title: "Marketing Page",
      description: "Hero, Features, Pricing, Testimonials",
      icon: Layout,
      page: "MarketingPageExample"
    },
    {
      title: "Calculator Tool",
      description: "Interaktiver Rechner mit Email-Gate",
      icon: Code,
      page: "CalculatorExample"
    },
    {
      title: "Wizard & Quiz",
      description: "Mehrstufige Formulare und Umfragen",
      icon: Layers,
      page: "WizardExample"
    },
    {
      title: "List Page",
      description: "Datentabellen mit Filterung & Pagination",
      icon: Layout,
      page: "ListPageExample"
    },
    {
      title: "Generator",
      description: "Dokument-Generator mit Live-Preview",
      icon: Code,
      page: "GeneratorExample"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="vf-page-header">
        <div>
          <h1 className="vf-page-title">Vermitify Design System</h1>
          <p className="vf-page-subtitle">Classic Ocean Sunset Theme - Vollständige Implementierung</p>
        </div>
      </div>

      <VermitifyThemeSelector />

      <div>
        <h2 className="text-2xl font-bold mb-6">Beispiel-Seiten</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {showcasePages.map((page, index) => {
            const Icon = page.icon;
            return (
              <Card key={index} className="vf-card-clickable">
                <CardHeader>
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-3 bg-[var(--theme-primary-light)] rounded-lg">
                      <Icon className="h-6 w-6 text-[var(--theme-primary)]" />
                    </div>
                    {page.badge && (
                      <span className="vf-badge vf-badge-success text-xs">
                        {page.badge}
                      </span>
                    )}
                  </div>
                  <CardTitle>{page.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-[var(--theme-text-secondary)] mb-4">
                    {page.description}
                  </p>
                  <Link to={createPageUrl(page.page)}>
                    <Button variant="outline" className="w-full">
                      Ansehen
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Implementierungsstatus</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">✅ Design-Tokens (Prompt #2)</span>
              <span className="vf-badge vf-badge-success">Fertig</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">✅ Theme-System (Prompt #3)</span>
              <span className="vf-badge vf-badge-success">Fertig</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">✅ Button-Komponente (Prompt #4)</span>
              <span className="vf-badge vf-badge-success">Fertig</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">✅ Card-Komponente (Prompt #5)</span>
              <span className="vf-badge vf-badge-success">Fertig</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">✅ Input-Komponenten (Prompt #6)</span>
              <span className="vf-badge vf-badge-success">Fertig</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">✅ Table-Komponente (Prompt #7)</span>
              <span className="vf-badge vf-badge-success">Fertig</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">✅ Badge, Alert & Toast (Prompt #8)</span>
              <span className="vf-badge vf-badge-success">Fertig</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">✅ Sidebar-Navigation (Prompt #9)</span>
              <span className="vf-badge vf-badge-success">Fertig</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">✅ Navbar/Header (Prompt #10)</span>
              <span className="vf-badge vf-badge-success">Fertig</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">✅ Modal/Dialog (Prompt #11)</span>
              <span className="vf-badge vf-badge-success">Fertig</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">✅ Dropdown & Select (Prompt #12)</span>
              <span className="vf-badge vf-badge-success">Fertig</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">✅ Progress & Loading (Prompt #13)</span>
              <span className="vf-badge vf-badge-success">Fertig</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">✅ Tooltip & Popover (Prompt #14)</span>
              <span className="vf-badge vf-badge-success">Fertig</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">✅ Empty & Error States (Prompt #15)</span>
              <span className="vf-badge vf-badge-success">Fertig</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">✅ Data Display (Prompt #16)</span>
              <span className="vf-badge vf-badge-success">Fertig</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">✅ Marketing Pages (Prompt #17)</span>
              <span className="vf-badge vf-badge-success">Fertig</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">✅ Lead Capture (Prompt #18)</span>
              <span className="vf-badge vf-badge-success">Fertig</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">✅ Calculator Template (Prompt #19)</span>
              <span className="vf-badge vf-badge-success">Fertig</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">✅ Wizard/Quiz/Generator (Prompt #20)</span>
              <span className="vf-badge vf-badge-success">Fertig</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">✅ List Page Templates (Prompt #21)</span>
              <span className="vf-badge vf-badge-success">Fertig</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}