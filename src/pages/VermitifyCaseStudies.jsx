import React from 'react';
import { VfMarketingLayout } from '@/components/marketing/VfMarketingLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingUp, Clock, Euro } from 'lucide-react';

export default function VermitifyCaseStudies() {
  const caseStudies = [
    {
      name: 'Alexander M.',
      role: 'Privater Vermieter',
      properties: 4,
      units: 12,
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
      stats: [
        { label: 'Zeit gespart', value: '8 Std/Monat', icon: Clock },
        { label: 'Steuerersparnis', value: '€3.200/Jahr', icon: Euro },
        { label: 'Rendite-Steigerung', value: '+0,8%', icon: TrendingUp }
      ],
      quote: 'vermitify hat meine Verwaltung revolutioniert. Die Anlage V erstelle ich jetzt in 10 Minuten statt 3 Stunden.',
      challenge: 'Zeitaufwändige manuelle Steuererklärung',
      solution: 'Automatische Anlage V Erstellung mit ELSTER-Export',
      result: '€3.200 Steuerersparnis durch bessere Dokumentation'
    },
    {
      name: 'Sabine K.',
      role: 'Hausverwaltung',
      properties: 12,
      units: 48,
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
      stats: [
        { label: 'Zeit gespart', value: '20 Std/Monat', icon: Clock },
        { label: 'Automatisierung', value: '85%', icon: TrendingUp },
        { label: 'Kundenzufriedenheit', value: '+45%', icon: TrendingUp }
      ],
      quote: 'Die BK-Abrechnungen erstelle ich jetzt für alle 48 Einheiten in unter 2 Stunden. Früher waren es 2 Tage.',
      challenge: 'Manuelle BK-Abrechnungen für 48 Einheiten',
      solution: 'Automatisierte BK-Abrechnung mit LetterXpress-Versand',
      result: '90% Zeitersparnis bei Betriebskosten'
    }
  ];

  return (
    <VfMarketingLayout>
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">Erfolgsgeschichten</h1>
          <p className="text-xl text-[var(--theme-text-secondary)]">
            Wie Vermieter mit vermitify Zeit und Geld sparen
          </p>
        </div>

        <div className="space-y-16">
          {caseStudies.map((study, index) => (
            <div key={index} className="vf-card p-8">
              <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                  <img 
                    src={study.image} 
                    alt={study.name}
                    className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
                  />
                  <h3 className="text-xl font-bold text-center mb-1">{study.name}</h3>
                  <p className="text-center text-[var(--theme-text-secondary)] mb-4">{study.role}</p>
                  <div className="text-center text-sm text-[var(--theme-text-muted)]">
                    {study.properties} Objekte • {study.units} Einheiten
                  </div>
                </div>

                <div className="md:col-span-2">
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {study.stats.map((stat) => {
                      const StatIcon = stat.icon;
                      return (
                        <div key={stat.label} className="text-center p-4 bg-[var(--vf-primary-50)] rounded-lg">
                          <StatIcon className="h-6 w-6 mx-auto mb-2 text-[var(--vf-primary-600)]" />
                          <div className="text-2xl font-bold mb-1">{stat.value}</div>
                          <div className="text-xs text-[var(--theme-text-muted)]">{stat.label}</div>
                        </div>
                      );
                    })}
                  </div>

                  <blockquote className="text-lg italic mb-6 pl-4 border-l-4 border-[var(--vf-primary-500)]">
                    "{study.quote}"
                  </blockquote>

                  <div className="space-y-4">
                    <div>
                      <div className="font-semibold text-sm text-[var(--theme-text-muted)] mb-1">HERAUSFORDERUNG</div>
                      <p className="text-[var(--theme-text-secondary)]">{study.challenge}</p>
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-[var(--theme-text-muted)] mb-1">LÖSUNG</div>
                      <p className="text-[var(--theme-text-secondary)]">{study.solution}</p>
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-[var(--theme-text-muted)] mb-1">ERGEBNIS</div>
                      <p className="text-[var(--theme-primary)] font-semibold">{study.result}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </VfMarketingLayout>
  );
}