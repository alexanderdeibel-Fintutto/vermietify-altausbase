import React from 'react';
import { Button } from '@/components/ui/button';
import { Wrench, ExternalLink } from 'lucide-react';

export default function MaintenanceMode() {
  return (
    <div className="vf-error-page">
      <div className="vf-error-page__content">
        <div className="vf-error-page__illustration mb-8">
          <Wrench className="h-32 w-32 text-[var(--theme-text-muted)] mx-auto" />
        </div>
        <h1 className="vf-error-page__title">Wartungsarbeiten</h1>
        <p className="vf-error-page__description">
          Vermitify wird gerade aktualisiert. Wir sind in Kürze wieder für Sie da.
        </p>
        <div className="vf-error-page__actions">
          <Button variant="gradient" onClick={() => window.open('https://status.vermitify.de', '_blank')}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Status-Seite
          </Button>
        </div>
      </div>
    </div>
  );
}