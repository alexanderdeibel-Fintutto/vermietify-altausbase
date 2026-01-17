import React from 'react';
import { VfMarketingLayout } from '@/components/marketing/VfMarketingLayout';
import { VfFeatureSection } from '@/components/marketing/VfFeatureSection';
import { VfCtaSection } from '@/components/marketing/VfCtaSection';
import { 
  Building2, Calculator, FileText, TrendingUp, 
  Euro, Users, Shield, Zap, Clock, Mail,
  Smartphone, BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function VermitifyFeatures() {
  const coreFeatures = [
    {
      icon: Building2,
      title: 'Objektverwaltung',
      description: 'Verwalten Sie alle Ihre Immobilien zentral. Gebäude, Einheiten, Mieter - perfekt strukturiert.'
    },
    {
      icon: Users,
      title: 'Mieterverwaltung',
      description: 'Kontaktdaten, Verträge, Zahlungshistorie - alle Informationen auf einen Blick.'
    },
    {
      icon: FileText,
      title: 'Vertragsmanagement',
      description: 'Mietverträge erstellen, verwalten, Kündigungen verfolgen - rechtssicher und automatisiert.'
    },
    {
      icon: Euro,
      title: 'Finanzverwaltung',
      description: 'Mieten, Ausgaben, Cashflow - behalten Sie den Überblick über alle Finanzen.'
    }
  ];

  const calculators = [
    {
      icon: Calculator,
      title: 'Rendite-Rechner',
      description: 'Brutto- und Netto-Rendite berechnen'
    },
    {
      icon: TrendingUp,
      title: 'AfA-Rechner',
      description: 'Abschreibung für Immobilien'
    },
    {
      icon: BarChart3,
      title: 'Cashflow-Rechner',
      description: 'Monatlichen Cashflow ermitteln'
    },
    {
      icon: TrendingUp,
      title: 'Indexmieten-Rechner',
      description: 'Mietanpassung nach VPI'
    }
  ];

  const automation = [
    {
      icon: Zap,
      title: 'Automatische BK-Abrechnung',
      description: 'Betriebskosten automatisch berechnen und versenden'
    },
    {
      icon: FileText,
      title: 'Dokumenten-Generator',
      description: 'Mietverträge, Kündigungen, Mahnungen - automatisch generiert'
    },
    {
      icon: Mail,
      title: 'E-Mail-Automation',
      description: 'Zahlungserinnerungen, Vertragsenden - automatisch versendet'
    },
    {
      icon: Clock,
      title: 'Zeit sparen',
      description: 'Bis zu 10 Stunden pro Monat einsparen'
    }
  ];

  return (
    <VfMarketingLayout>
      <div className="pt-20 pb-12 text-center">
        <h1 className="text-5xl font-bold mb-4">
          Alle Features im Überblick
        </h1>
        <p className="text-xl text-[var(--theme-text-secondary)] max-w-2xl mx-auto">
          Professionelle Immobilienverwaltung für jeden Vermieter
        </p>
      </div>

      <VfFeatureSection
        title="Kernfunktionen"
        description="Alles was Sie für die tägliche Verwaltung brauchen"
        features={coreFeatures}
        columns={2}
      />

      <div className="bg-[var(--vf-primary-50)] py-16">
        <VfFeatureSection
          title="Kostenlose Rechner"
          description="Alle wichtigen Berechnungen sofort verfügbar"
          features={calculators}
          columns={4}
        />
      </div>

      <VfFeatureSection
        title="Automatisierung"
        description="Lassen Sie die Software für Sie arbeiten"
        features={automation}
        columns={4}
      />

      <VfCtaSection
        headline="Bereit für die Zukunft der Immobilienverwaltung?"
        subheadline="Testen Sie alle Features 14 Tage kostenlos"
        cta={
          <Button variant="gradient" size="lg">
            Jetzt kostenlos starten →
          </Button>
        }
        gradient
      />
    </VfMarketingLayout>
  );
}