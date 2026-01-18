import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, WifiOff } from 'lucide-react';

export default function OfflineError() {
  return (
    <div className="vf-error-page">
      <div className="vf-error-page__content">
        <div className="vf-error-page__illustration mb-8">
          <WifiOff className="h-32 w-32 text-[var(--theme-text-muted)] mx-auto" />
        </div>
        <h1 className="vf-error-page__title">Keine Internetverbindung</h1>
        <p className="vf-error-page__description">
          Bitte überprüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.
        </p>
        <div className="vf-error-page__actions">
          <Button variant="gradient" onClick={() => location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Erneut versuchen
          </Button>
        </div>
      </div>
    </div>
  );
}