import React from 'react';
import { VfMarketingLayout } from '@/components/marketing/VfMarketingLayout';
import { VfPricingSection } from '@/components/marketing/VfPricingSection';
import { VfCtaSection } from '@/components/marketing/VfCtaSection';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

export default function VermitifyPricing() {
  const plans = [
    {
      name: 'Starter',
      price: '0',
      period: 'Kostenlos',
      description: 'Perfekt für den Einstieg',
      features: [
        'Bis zu 2 Objekte',
        'Unbegrenzt Einheiten',
        'Alle Rechner kostenlos',
        'Basis-Dokumente',
        'Community-Support',
        'Mobile App'
      ],
      cta: 'Kostenlos starten'
    },
    {
      name: 'Professional',
      price: '29',
      period: 'pro Monat',
      description: 'Für professionelle Vermieter',
      highlighted: true,
      features: [
        'Unbegrenzt Objekte',
        'Unbegrenzt Einheiten',
        'Alle Premium-Features',
        'Anlage V Export (ELSTER)',
        'BK-Abrechnungen automatisch',
        'Mietvertrag-Generator',
        'LetterXpress Integration',
        'E-Mail-Support',
        'Daten-Export',
        'API-Zugang'
      ],
      cta: '14 Tage kostenlos testen'
    },
    {
      name: 'Business',
      price: '79',
      period: 'pro Monat',
      description: 'Für Hausverwaltungen',
      features: [
        'Alles aus Professional',
        'Multi-Mandanten',
        'Team-Funktionen (5 Nutzer)',
        'White-Label Option',
        'Erweiterte API',
        'Dedicated Support',
        'Onboarding-Beratung',
        'SLA-Garantie'
      ],
      cta: 'Kontakt aufnehmen'
    }
  ];

  return (
    <VfMarketingLayout>
      <div className="pt-20 pb-12 text-center">
        <h1 className="text-5xl font-bold mb-4">
          Transparent. Fair. Flexibel.
        </h1>
        <p className="text-xl text-[var(--theme-text-secondary)] max-w-2xl mx-auto">
          Wählen Sie den Plan, der zu Ihrem Portfolio passt
        </p>
      </div>

      <VfPricingSection plans={plans} />

      <section className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Häufige Fragen</h2>
        <div className="space-y-6">
          <div className="vf-card p-6">
            <h3 className="font-semibold mb-2">Kann ich jederzeit kündigen?</h3>
            <p className="text-[var(--theme-text-secondary)]">
              Ja, Sie können monatlich kündigen. Keine Mindestlaufzeit, keine versteckten Kosten.
            </p>
          </div>
          <div className="vf-card p-6">
            <h3 className="font-semibold mb-2">Was passiert nach der Testphase?</h3>
            <p className="text-[var(--theme-text-secondary)]">
              Nach 14 Tagen können Sie entscheiden: Kostenlos weitermachen mit Starter oder upgraden auf Professional.
            </p>
          </div>
          <div className="vf-card p-6">
            <h3 className="font-semibold mb-2">Sind meine Daten sicher?</h3>
            <p className="text-[var(--theme-text-secondary)]">
              Absolut. Server in Deutschland, DSGVO-konform, verschlüsselte Übertragung, tägliche Backups.
            </p>
          </div>
        </div>
      </section>

      <VfCtaSection
        headline="Bereit für professionelle Verwaltung?"
        subheadline="Starten Sie jetzt kostenlos - keine Kreditkarte erforderlich"
        cta={
          <Button variant="gradient" size="lg">
            14 Tage kostenlos testen
          </Button>
        }
        gradient
      />
    </VfMarketingLayout>
  );
}