import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function Error404() {
  const navigate = useNavigate();

  return (
    <div className="vf-error-page">
      <div className="vf-error-page__content">
        <div className="vf-error-page__illustration mb-8">
          <div className="text-9xl">🔍</div>
        </div>
        <div className="vf-error-page__code">404</div>
        <h1 className="vf-error-page__title">Seite nicht gefunden</h1>
        <p className="vf-error-page__description">
          Die angeforderte Seite existiert nicht oder wurde verschoben.
        </p>
        <div className="vf-error-page__actions">
          <Button variant="gradient" onClick={() => navigate('/')}>
            <Home className="h-4 w-4 mr-2" />
            Zur Startseite
          </Button>
          <Button variant="secondary" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>
        </div>
      </div>
    </div>
  );
}