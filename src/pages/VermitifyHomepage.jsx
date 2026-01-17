import React from 'react';
import { VfMarketingLayout } from '@/components/marketing/VfMarketingLayout';
import { VfHero } from '@/components/marketing/VfHero';
import { VfFeatureSection } from '@/components/marketing/VfFeatureSection';
import { VfPricingSection } from '@/components/marketing/VfPricingSection';
import { VfTestimonialsSection } from '@/components/marketing/VfTestimonialsSection';
import { VfCtaSection } from '@/components/marketing/VfCtaSection';
import { Building2, FileText, Calculator, TrendingUp, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';

export default function VermitifyHomepage() {
  const features = [
    {
      icon: Building2,
      title: 'Objektverwaltung',
      description: 'Alle Immobilien an einem Ort. Einheiten, Mieter, Verträge - perfekt organisiert.'
    },
    {
      icon: Calculator,
      title: 'Kostenlose Rechner',
      description: 'Rendite, AfA, Indexmiete - alle wichtigen Berechnungen sofort verfügbar.'
    },
    {
      icon: FileText,
      title: 'Automatische Dokumente',
      description: 'Mietverträge, Kündigungen, BK-Abrechnungen - rechtssicher generiert.'
    },
    {
      icon: TrendingUp,
      title: 'Anlage V Export',
      description: 'Steueroptimiert für Vermieter. ELSTER-Export mit einem Klick.'
    },
    {
      icon: Shield,
      title: 'DSGVO-konform',
      description: 'Ihre Daten sind sicher. Server in Deutschland, verschlüsselt.'
    },
    {
      icon: Zap,
      title: 'Zeitsparend',
      description: 'Bis zu 10 Stunden pro Monat sparen durch Automatisierung.'
    }
  ];

  const plans = [
    {
      name: 'Starter',
      price: '0',
      period: 'Kostenlos',
      features: [
        'Bis zu 2 Objekte',
        'Alle Rechner kostenlos',
        'Basis-Dokumente',
        'Community-Support'
      ],
      cta: 'Kostenlos starten'
    },
    {
      name: 'Professional',
      price: '29',
      period: 'pro Monat',
      highlighted: true,
      features: [
        'Unbegrenzt Objekte',
        'Alle Premium-Features',
        'Anlage V Export',
        'BK-Abrechnungen',
        'E-Mail-Support',
        'LetterXpress Integration'
      ],
      cta: '14 Tage testen'
    },
    {
      name: 'Business',
      price: '79',
      period: 'pro Monat',
      features: [
        'Alles aus Professional',
        'Multi-Mandanten',
        'Team-Funktionen',
        'API-Zugang',
        'Priority Support'
      ],
      cta: 'Kontakt aufnehmen'
    }
  ];

  const testimonials = [
    {
      quote: 'vermitify hat meine Immobilienverwaltung revolutioniert. Die Anlage V erstelle ich jetzt in 10 Minuten statt 3 Stunden.',
      author: 'Alexander M.',
      role: 'Privater Vermieter, 4 Objekte',
      avatar: null
    },
    {
      quote: 'Endlich eine Software, die speziell für deutsche Vermieter entwickelt wurde. Die BK-Abrechnungen sind perfekt.',
      author: 'Sabine K.',
      role: 'Hausverwaltung, 12 Objekte',
      avatar: null
    }
  ];

  return (
    <VfMarketingLayout>
      <ConversionTracker eventType="homepage_view" />
      <VfHero
        headline="Immobilien verwalten. Steuern sparen. Zeit gewinnen."
        subheadline="Die All-in-One Software für private und professionelle Vermieter in Deutschland"
        primaryCta={
          <Button variant="gradient" size="lg">
            Jetzt kostenlos testen
          </Button>
        }
        secondaryCta={
          <Button variant="outline" size="lg" asChild>
            <a href={createPageUrl('VermitifyToolsOverview')}>
              Kostenlose Tools →
            </a>
          </Button>
        }
        gradient
      />

      <VfFeatureSection
        title="Alles, was Sie als Vermieter brauchen"
        description="Von der ersten Immobilie bis zum Portfolio"
        features={features}
        columns={3}
      />

      <VfPricingSection
        title="Transparent. Fair. Flexibel."
        description="Wählen Sie den Plan, der zu Ihnen passt"
        plans={plans}
      />

      <VfTestimonialsSection
        title="Vermieter vertrauen vermitify"
        testimonials={testimonials}
      />

      <VfCtaSection
        headline="Bereit für professionelle Immobilienverwaltung?"
        subheadline="Starten Sie kostenlos - keine Kreditkarte erforderlich"
        cta={
          <Button variant="gradient" size="lg">
            Jetzt 14 Tage kostenlos testen
          </Button>
        }
        gradient
      />
    </VfMarketingLayout>
  );
}