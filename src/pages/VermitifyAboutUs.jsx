import React from 'react';
import { VfMarketingLayout } from '@/components/marketing/VfMarketingLayout';
import { Button } from '@/components/ui/button';
import { Target, Users, Award, TrendingUp } from 'lucide-react';

export default function VermitifyAboutUs() {
  return (
    <VfMarketingLayout>
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6">
            Wir machen Immobilienverwaltung einfach
          </h1>
          <p className="text-xl text-[var(--theme-text-secondary)] max-w-2xl mx-auto">
            vermitify wurde von Vermietern für Vermieter entwickelt. 
            Wir kennen die Herausforderungen - und haben die Lösung.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="vf-card p-8">
            <div className="vf-feature-icon mb-4">
              <Target className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Unsere Mission</h3>
            <p className="text-[var(--theme-text-secondary)] leading-relaxed">
              Wir möchten jedem Vermieter in Deutschland ermöglichen, seine Immobilien 
              professionell zu verwalten - ohne Steuerberater, ohne Hausverwaltung, 
              ohne Zeitaufwand.
            </p>
          </div>

          <div className="vf-card p-8">
            <div className="vf-feature-icon mb-4">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Unser Team</h3>
            <p className="text-[var(--theme-text-secondary)] leading-relaxed">
              Ein Team aus Software-Entwicklern, Immobilien-Experten und Steuerberatern 
              arbeitet täglich daran, vermitify noch besser zu machen.
            </p>
          </div>
        </div>

        <div className="bg-[var(--vf-primary-50)] rounded-2xl p-12 mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">In Zahlen</h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold text-[var(--vf-primary-600)] mb-2">2.500+</div>
              <div className="text-[var(--theme-text-secondary)]">Zufriedene Vermieter</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-[var(--vf-primary-600)] mb-2">8.000+</div>
              <div className="text-[var(--theme-text-secondary)]">Verwaltete Objekte</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-[var(--vf-primary-600)] mb-2">4,9/5</div>
              <div className="text-[var(--theme-text-secondary)]">Kundenbewertung</div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold mb-6">Bereit durchzustarten?</h2>
          <Button variant="gradient" size="lg">
            Jetzt kostenlos testen →
          </Button>
        </div>
      </div>
    </VfMarketingLayout>
  );
}