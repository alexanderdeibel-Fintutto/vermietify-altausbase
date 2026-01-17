import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { VfMarketingLayout } from '@/components/marketing/VfMarketingLayout';
import { VfHero } from '@/components/marketing/VfHero';
import { VfFeatureSection } from '@/components/marketing/VfFeatureSection';
import { Calculator, TrendingUp, TrendingDown, FileText, CheckSquare, Home, DollarSign, PiggyBank } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function VermitifyToolsOverview() {
  const tools = [
    {
      title: 'Rendite-Rechner',
      description: 'Berechnen Sie die Brutto- und Netto-Rendite Ihrer Immobilie',
      icon: Calculator,
      href: createPageUrl('RenditeRechner'),
      badge: 'Beliebt'
    },
    {
      title: 'Indexmieten-Rechner',
      description: 'Ermitteln Sie die zulässige Mieterhöhung nach VPI',
      icon: TrendingUp,
      href: createPageUrl('IndexmietenRechner')
    },
    {
      title: 'AfA-Rechner',
      description: 'Berechnen Sie die jährliche Abschreibung',
      icon: TrendingDown,
      href: createPageUrl('AfACalculator')
    },
    {
      title: 'Cashflow-Rechner',
      description: 'Ermitteln Sie Ihren monatlichen Cashflow',
      icon: DollarSign,
      href: createPageUrl('CashflowRechner')
    },
    {
      title: 'Tilgungs-Rechner',
      description: 'Berechnen Sie Ihre Kreditrate und Laufzeit',
      icon: PiggyBank,
      href: createPageUrl('TilgungsRechner')
    },
    {
      title: 'Kaufpreis-Rechner',
      description: 'Finden Sie den richtigen Kaufpreis für Ihre Zielrendite',
      icon: Home,
      href: createPageUrl('KaufpreisRechner')
    },
    {
      title: 'Wertentwicklungs-Rechner',
      description: 'Prognostizieren Sie die Wertsteigerung',
      icon: TrendingUp,
      href: createPageUrl('WertentwicklungsRechner')
    },
    {
      title: 'BK-Checker',
      description: 'Prüfen Sie Ihre Betriebskosten auf Plausibilität',
      icon: CheckSquare,
      href: createPageUrl('BKChecker')
    },
    {
      title: 'Mietvertrag-Generator',
      description: 'Erstellen Sie rechtssichere Mietverträge',
      icon: FileText,
      href: createPageUrl('MietvertragGenerator')
    }
  ];

  return (
    <VfMarketingLayout>
      <VfHero
        headline="Kostenlose Tools für Vermieter"
        subheadline="Professionelle Rechner und Generatoren für Ihre Immobilienverwaltung"
        gradient
      />

      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Alle Tools im Überblick</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => {
            const ToolIcon = tool.icon;
            return (
              <Link key={tool.title} to={tool.href}>
                <Card className="vf-card-clickable h-full">
                  <CardHeader>
                    <div className="vf-feature-icon mb-4">
                      <ToolIcon className="h-6 w-6" />
                    </div>
                    <CardTitle className="flex items-center gap-2">
                      {tool.title}
                      {tool.badge && (
                        <span className="vf-badge vf-badge-accent text-xs">{tool.badge}</span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-[var(--theme-text-secondary)]">
                      {tool.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="bg-[var(--vf-primary-50)] py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Alle Tools in einer Software</h2>
          <p className="text-lg text-[var(--theme-text-secondary)] mb-8">
            Verwalten Sie Ihre Immobilien professionell mit vermitify. 
            Alle Rechner integriert, automatische Dokumentenerstellung, steueroptimiert.
          </p>
          <Button variant="gradient" size="lg">
            Jetzt kostenlos testen →
          </Button>
        </div>
      </section>
    </VfMarketingLayout>
  );
}