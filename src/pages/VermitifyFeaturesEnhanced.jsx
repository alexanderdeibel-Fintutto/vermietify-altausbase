import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Building, FileText, TrendingUp, Users, 
  Calculator, Mail, Shield, Zap, ArrowRight 
} from 'lucide-react';

export default function VermitifyFeaturesEnhanced() {
  const features = [
    {
      icon: Building,
      title: 'Objektverwaltung',
      description: 'Verwalten Sie alle Ihre Immobilien zentral. Gebäude, Einheiten, Mieter – alles im Überblick.',
      benefits: ['Unbegrenzte Objekte', 'Einheiten-Management', 'Foto-Galerien', 'Wartungshistorie']
    },
    {
      icon: FileText,
      title: 'Dokumenten-Automatisierung',
      description: 'Generieren Sie rechtssichere Dokumente per Klick. Mietverträge, Kündigungen, Abrechnungen.',
      benefits: ['30+ Vorlagen', 'Automatische Befüllung', 'PDF-Export', 'E-Signatur']
    },
    {
      icon: TrendingUp,
      title: 'Anlage V & Steuern',
      description: 'Automatische Generierung der Anlage V mit ELSTER-Integration. AfA-Rechner inklusive.',
      benefits: ['ELSTER-Export', 'AfA-Kalkulation', 'Werbungskosten', 'Steueroptimierung']
    },
    {
      icon: Users,
      title: 'Mieter-Portal',
      description: 'Ihre Mieter können selbstständig Dokumente einsehen, Schäden melden und kommunizieren.',
      benefits: ['Self-Service', 'Schadensmeldung', 'Dokumentenzugriff', 'Zahlungsübersicht']
    },
    {
      icon: Calculator,
      title: 'Profi-Rechner',
      description: 'Rendite-Rechner, Indexmieten-Kalkulator, AfA-Berechnung und mehr.',
      benefits: ['Renditeberechnung', 'Indexmiete (VPI)', 'Cashflow-Planung', 'ROI-Analyse']
    },
    {
      icon: Mail,
      title: 'Kommunikation',
      description: 'Automatisierte Erinnerungen, Massenversand, E-Mail-Vorlagen.',
      benefits: ['E-Mail-Automation', 'WhatsApp', 'Briefversand', 'Templates']
    },
    {
      icon: Shield,
      title: 'Sicherheit & DSGVO',
      description: 'Bank-Level Verschlüsselung. DSGVO-konform. Server in Deutschland.',
      benefits: ['SSL-Verschlüsselung', 'DSGVO-konform', 'Backup täglich', 'ISO 27001']
    },
    {
      icon: Zap,
      title: 'KI-Assistenten',
      description: 'Intelligente Kategorisierung, automatische Belegerfassung, Steueroptimierung.',
      benefits: ['Auto-Kategorisierung', 'Beleg-Scanner', 'Steuer-Tipps', 'Smart Suggestions']
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">Alle Features im Überblick</h1>
          <p className="text-xl text-[var(--vf-neutral-600)] max-w-3xl mx-auto">
            Vermitify vereint alle Tools, die Sie für die professionelle Immobilienverwaltung brauchen
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white border border-[var(--vf-neutral-200)] rounded-2xl p-8 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-gradient-to-br from-[var(--vf-primary-600)] to-[var(--vf-accent-500)] rounded-xl flex items-center justify-center mb-6">
                <feature.icon className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-[var(--vf-neutral-600)] mb-6">{feature.description}</p>
              <ul className="space-y-2">
                {feature.benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-[var(--vf-success-500)]" />
                    <span className="text-sm">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <h2 className="text-3xl font-bold mb-4">Bereit zu starten?</h2>
          <p className="text-lg text-[var(--vf-neutral-600)] mb-8">
            Testen Sie Vermitify 14 Tage kostenlos
          </p>
          <Button variant="gradient" size="lg">
            Jetzt kostenlos testen
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}