import React from 'react';
import { VfMarketingLayout, VfMarketingNavbar, VfMarketingFooter } from '@/components/marketing/VfMarketingLayout';
import { VfHero } from '@/components/marketing/VfHero';
import { VfFeatureSection } from '@/components/marketing/VfFeatureSection';
import { VfPricingSection } from '@/components/marketing/VfPricingSection';
import { VfTestimonialsSection } from '@/components/marketing/VfTestimonialsSection';
import { VfCtaSection } from '@/components/marketing/VfCtaSection';
import { Button } from '@/components/ui/button';
import VermitifyLogo from '@/components/branding/VermitifyLogo';
import { Building2, Users, Shield, TrendingUp, FileText, Zap } from 'lucide-react';

export default function MarketingPageExample() {
  return (
    <VfMarketingLayout
      navbar={
        <VfMarketingNavbar
          logo={<VermitifyLogo size="sm" colorMode="gradient" />}
          links={[
            { label: "Features", href: "#features" },
            { label: "Preise", href: "#pricing" },
            { label: "Testimonials", href: "#testimonials" },
            { label: "Kontakt", href: "#contact" }
          ]}
          cta={<Button variant="gradient">Kostenlos testen</Button>}
        />
      }
      footer={
        <VfMarketingFooter
          logo={<VermitifyLogo size="sm" colorMode="white" />}
          description="Die professionelle Lösung für moderne Immobilienverwaltung"
          sections={[
            {
              title: "Produkt",
              links: [
                { label: "Features", href: "#features" },
                { label: "Preise", href: "#pricing" },
                { label: "Updates", href: "#updates" }
              ]
            },
            {
              title: "Unternehmen",
              links: [
                { label: "Über uns", href: "#about" },
                { label: "Kontakt", href: "#contact" },
                { label: "Karriere", href: "#careers" }
              ]
            },
            {
              title: "Rechtliches",
              links: [
                { label: "Datenschutz", href: "#privacy" },
                { label: "AGB", href: "#terms" },
                { label: "Impressum", href: "#imprint" }
              ]
            }
          ]}
        />
      }
    >
      <VfHero
        headline="Immobilienverwaltung der Zukunft"
        subheadline="Verwalten Sie Ihre Immobilien effizienter, digitaler und professioneller als je zuvor"
        primaryCta={<Button variant="gradient" size="lg">Kostenlos starten</Button>}
        secondaryCta={<Button variant="outline" size="lg">Demo ansehen</Button>}
      />

      <VfFeatureSection
        title="Alles was Sie brauchen"
        description="Leistungsstarke Tools für professionelle Verwaltung"
        columns={3}
        features={[
          {
            icon: <Building2 className="h-6 w-6" />,
            title: "Objektverwaltung",
            description: "Verwalten Sie unbegrenzt viele Immobilien zentral"
          },
          {
            icon: <Users className="h-6 w-6" />,
            title: "Mieterverwaltung",
            description: "Komplette Mieterdaten und Kommunikation"
          },
          {
            icon: <FileText className="h-6 w-6" />,
            title: "Dokumentenmanagement",
            description: "Alle Verträge und Dokumente digital"
          },
          {
            icon: <TrendingUp className="h-6 w-6" />,
            title: "Finanzübersicht",
            description: "Einnahmen und Ausgaben im Blick"
          },
          {
            icon: <Shield className="h-6 w-6" />,
            title: "Rechtssicherheit",
            description: "Gesetzeskonforme Prozesse"
          },
          {
            icon: <Zap className="h-6 w-6" />,
            title: "Automatisierung",
            description: "Workflows automatisch ausführen"
          }
        ]}
      />

      <VfPricingSection
        title="Transparente Preise"
        description="Wählen Sie das Paket, das zu Ihnen passt"
        plans={[
          {
            name: "Starter",
            price: "29€",
            period: "/Monat",
            features: [
              "Bis zu 5 Objekte",
              "Unbegrenzte Mieter",
              "Basis-Support",
              "Mobile App"
            ],
            cta: <Button variant="outline" className="w-full">Auswählen</Button>
          },
          {
            name: "Professional",
            price: "79€",
            period: "/Monat",
            highlighted: true,
            features: [
              "Unbegrenzte Objekte",
              "Unbegrenzte Mieter",
              "Priority Support",
              "API-Zugang",
              "White-Label Option"
            ],
            cta: <Button variant="gradient" className="w-full">Jetzt starten</Button>
          },
          {
            name: "Enterprise",
            price: "Individuell",
            period: "",
            features: [
              "Alles aus Professional",
              "Dedizierter Account Manager",
              "SLA Garantie",
              "Custom Integrationen"
            ],
            cta: <Button variant="outline" className="w-full">Kontakt aufnehmen</Button>
          }
        ]}
      />

      <VfTestimonialsSection
        title="Was unsere Kunden sagen"
        testimonials={[
          {
            quote: "Vermitify hat unsere Verwaltung komplett transformiert. Wir sparen 10 Stunden pro Woche!",
            name: "Michael Wagner",
            role: "Immobilienverwalter",
            avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"
          },
          {
            quote: "Endlich eine Software, die wirklich alle Anforderungen abdeckt. Absolute Empfehlung!",
            name: "Sarah Müller",
            role: "Geschäftsführerin",
            avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop"
          },
          {
            quote: "Der Support ist erstklassig und die Software intuitiv. Perfekt für unsere Bedürfnisse.",
            name: "Thomas Schmidt",
            role: "Portfolio Manager",
            avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop"
          }
        ]}
      />

      <VfCtaSection
        headline="Bereit durchzustarten?"
        subheadline="Testen Sie Vermitify 14 Tage kostenlos und unverbindlich"
        primaryCta={<Button variant="gradient" size="lg" className="bg-white text-[var(--vf-primary-800)] hover:bg-[var(--vf-neutral-100)]">Jetzt kostenlos testen</Button>}
        gradient
      />
    </VfMarketingLayout>
  );
}