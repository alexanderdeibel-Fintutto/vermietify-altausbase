import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Mail } from 'lucide-react';

export default function Error500() {
  return (
    <div className="vf-error-page">
      <div className="vf-error-page__content">
        <div className="vf-error-page__illustration mb-8">
          <div className="text-9xl">⚠️</div>
        </div>
        <div className="vf-error-page__code">500</div>
        <h1 className="vf-error-page__title">Ein Fehler ist aufgetreten</h1>
        <p className="vf-error-page__description">
          Entschuldigung, da ist etwas schief gelaufen. Wir arbeiten daran.
        </p>
        <div className="vf-error-page__actions">
          <Button variant="gradient" onClick={() => location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Erneut versuchen
          </Button>
          <Button variant="secondary" onClick={() => window.location.href = '/support-center'}>
            <Mail className="h-4 w-4 mr-2" />
            Support kontaktieren
          </Button>
        </div>
      </div>
    </div>
  );
}