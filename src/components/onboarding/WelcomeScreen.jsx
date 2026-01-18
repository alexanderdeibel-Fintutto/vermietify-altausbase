import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function WelcomeScreen({ onStart }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--vf-primary-50)] to-white p-6">
      <div className="text-center max-w-2xl">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm mb-6">
          <Sparkles className="h-4 w-4 text-[var(--theme-primary)]" />
          <span className="text-sm font-medium">Willkommen bei Vermitify</span>
        </div>

        <h1 className="text-5xl font-bold mb-4 vf-gradient-text">
          Ihre Immobilienverwaltung beginnt hier
        </h1>

        <p className="text-xl text-[var(--theme-text-secondary)] mb-8">
          In nur 5 Minuten eingerichtet. Keine Kreditkarte erforderlich.
        </p>

        <Button variant="gradient" size="lg" onClick={onStart}>
          Los geht's
          <ArrowRight className="h-5 w-5 ml-2" />
        </Button>

        <div className="flex justify-center gap-8 mt-12 text-sm text-[var(--theme-text-muted)]">
          <div>✓ Kostenlose Testphase</div>
          <div>✓ Keine Vertragsbindung</div>
          <div>✓ Schneller Support</div>
        </div>
      </div>
    </div>
  );
}