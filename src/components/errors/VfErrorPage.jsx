import React from 'react';
import { Button } from '@/components/ui/button';
import { Home, RefreshCw, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export function VfErrorPage({ 
  code, 
  title, 
  description, 
  actions = [] 
}) {
  return (
    <div className="vf-error-page">
      <div className="vf-error-page__content">
        {code && <div className="vf-error-page__code">{code}</div>}
        <h1 className="vf-error-page__title">{title}</h1>
        <p className="vf-error-page__description">{description}</p>
        
        {actions.length > 0 && (
          <div className="vf-error-page__actions">
            {actions.map((action, index) => (
              action.href ? (
                <Link key={index} to={action.href}>
                  <Button variant={action.variant || 'primary'}>
                    {action.label}
                  </Button>
                </Link>
              ) : (
                <Button 
                  key={index} 
                  variant={action.variant || 'primary'}
                  onClick={action.onClick}
                >
                  {action.label}
                </Button>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function VfError404() {
  return (
    <VfErrorPage
      code="404"
      title="Seite nicht gefunden"
      description="Die angeforderte Seite existiert nicht oder wurde verschoben."
      actions={[
        { label: 'Zur Startseite', href: createPageUrl('Dashboard'), variant: 'primary' },
        { label: 'Zurück', onClick: () => window.history.back(), variant: 'secondary' }
      ]}
    />
  );
}

export function VfError500() {
  return (
    <VfErrorPage
      code="500"
      title="Ein Fehler ist aufgetreten"
      description="Entschuldigung, da ist etwas schief gelaufen. Wir arbeiten daran."
      actions={[
        { 
          label: 'Erneut versuchen', 
          onClick: () => window.location.reload(), 
          variant: 'primary' 
        },
        { 
          label: 'Support kontaktieren', 
          href: createPageUrl('SupportCenter'), 
          variant: 'secondary' 
        }
      ]}
    />
  );
}

export function VfErrorOffline() {
  return (
    <VfErrorPage
      title="Keine Internetverbindung"
      description="Bitte überprüfen Sie Ihre Internetverbindung und versuchen Sie es erneut."
      actions={[
        { 
          label: 'Erneut versuchen', 
          onClick: () => window.location.reload(), 
          variant: 'primary' 
        }
      ]}
    />
  );
}

export function VfErrorMaintenance() {
  return (
    <VfErrorPage
      title="Wartungsarbeiten"
      description="vermitify wird gerade aktualisiert. Wir sind in Kürze wieder für Sie da."
      actions={[
        { 
          label: 'Status-Seite', 
          onClick: () => window.open('https://status.vermitify.de', '_blank'),
          variant: 'primary' 
        }
      ]}
    />
  );
}