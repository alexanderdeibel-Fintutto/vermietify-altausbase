import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { VfMarketingLayout } from '@/components/marketing/VfMarketingLayout';
import { VfHero } from '@/components/marketing/VfHero';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calculator, TrendingUp, TrendingDown, FileText, CheckSquare, Home, DollarSign, PiggyBank, BarChart3 } from 'lucide-react';

export default function ToolsLandingPage() {
  const tools = [
    { title: 'Rendite-Rechner', icon: Calculator, href: 'RenditeRechner', description: 'Brutto- & Netto-Rendite', popular: true },
    { title: 'Indexmieten', icon: TrendingUp, href: 'IndexmietenRechner', description: 'VPI-basierte Mieterhöhung' },
    { title: 'AfA-Rechner', icon: TrendingDown, href: 'AfACalculator', description: 'Abschreibung berechnen' },
    { title: 'Cashflow', icon: DollarSign, href: 'CashflowRechner', description: 'Monatlicher Cashflow' },
    { title: 'Tilgung', icon: PiggyBank, href: 'TilgungsRechner', description: 'Kreditrate & Laufzeit' },
    { title: 'Kaufpreis', icon: Home, href: 'KaufpreisRechner', description: 'Maximaler Kaufpreis' },
    { title: 'Wertentwicklung', icon: TrendingUp, href: 'WertentwicklungsRechner', description: 'Wertsteigerung prognostizieren' },
    { title: 'BK-Checker', icon: CheckSquare, href: 'BKChecker', description: 'Betriebskosten prüfen' },
    { title: 'Mietvertrag', icon: FileText, href: 'MietvertragGenerator', description: 'Mietvertrag erstellen' }
  ];

  return (
    <VfMarketingLayout>
      <VfHero
        headline="9 kostenlose Tools für Vermieter"
        subheadline="Professionelle Rechner und Generatoren - komplett kostenlos, ohne Registrierung"
        gradient
      />

      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {tools.map((tool) => {
            const ToolIcon = tool.icon;
            return (
              <Link key={tool.title} to={createPageUrl(tool.href)}>
                <Card className="vf-card-clickable h-full relative">
                  {tool.popular && (
                    <div className="absolute top-3 right-3">
                      <span className="vf-badge vf-badge-accent">Beliebt</span>
                    </div>
                  )}
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-[var(--vf-gradient-primary)] rounded-xl flex items-center justify-center text-white">
                      <ToolIcon className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{tool.title}</h3>
                    <p className="text-sm text-[var(--theme-text-secondary)]">
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
          <h2 className="text-3xl font-bold mb-4">Alle Tools. Eine Software.</h2>
          <p className="text-lg text-[var(--theme-text-secondary)] mb-8">
            Mit vermitify Professional erhalten Sie nicht nur alle Rechner, 
            sondern auch automatische Verwaltung, ELSTER-Export und vieles mehr.
          </p>
          <Button variant="gradient" size="lg">
            Jetzt 14 Tage kostenlos testen →
          </Button>
        </div>
      </section>
    </VfMarketingLayout>
  );
}