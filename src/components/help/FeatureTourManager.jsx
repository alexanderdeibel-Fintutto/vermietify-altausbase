import React from 'react';
import GuidedTourSpotlight from './GuidedTourSpotlight';

const TOURS = {
  'bk-wizard': {
    id: 'bk-wizard',
    steps: [
      {
        target: '[data-tour="bk-start"]',
        title: 'Willkommen zum BK-Wizard',
        description: 'Erstellen Sie eine Betriebskostenabrechnung in 4 einfachen Schritten.'
      },
      {
        target: '[data-tour="bk-building"]',
        title: 'Gebäude auswählen',
        description: 'Wählen Sie das Gebäude für die Abrechnung aus.'
      },
      {
        target: '[data-tour="bk-period"]',
        title: 'Abrechnungszeitraum',
        description: 'Legen Sie den Zeitraum fest (üblicherweise 12 Monate).'
      },
      {
        target: '[data-tour="bk-costs"]',
        title: 'Kosten auswählen',
        description: 'Nur umlagefähige Kosten werden automatisch vorausgewählt.'
      }
    ]
  },
  'contract-creation': {
    id: 'contract-creation',
    steps: [
      {
        target: '[data-tour="contract-unit"]',
        title: 'Einheit auswählen',
        description: 'Wählen Sie die zu vermietende Wohneinheit aus.'
      },
      {
        target: '[data-tour="contract-tenant"]',
        title: 'Mieter zuordnen',
        description: 'Wählen Sie einen vorhandenen Mieter oder legen Sie einen neuen an.'
      },
      {
        target: '[data-tour="contract-rent"]',
        title: 'Mietkonditionen',
        description: 'Kaltmiete, Nebenkosten und Heizkosten werden zur Warmmiete addiert.'
      },
      {
        target: '[data-tour="contract-deposit"]',
        title: 'Kaution & Kündigungsfrist',
        description: 'Max. 3 Monatsmieten Kaution, gesetzliche Kündigungsfrist: 3 Monate.'
      }
    ]
  },
  'dashboard-first-visit': {
    id: 'dashboard-first-visit',
    steps: [
      {
        target: '[data-tour="quick-actions"]',
        title: 'Schnellaktionen',
        description: 'Häufige Aktionen wie Rechnung erfassen oder Vertrag anlegen.'
      },
      {
        target: '[data-tour="sidebar"]',
        title: 'Navigation',
        description: 'Zugriff auf alle Module: Immobilien, Mieter, Finanzen, Steuern.'
      },
      {
        target: '[data-tour="onboarding-checklist"]',
        title: 'Onboarding-Checkliste',
        description: 'Schrittweise Einrichtung Ihrer Verwaltung.'
      }
    ]
  }
};

export default function FeatureTourManager({ tourId, onComplete }) {
  const tour = TOURS[tourId];
  
  if (!tour) return null;

  return (
    <GuidedTourSpotlight
      tourId={tour.id}
      steps={tour.steps}
      onComplete={onComplete}
    />
  );
}

export function useTourTrigger(tourId, condition) {
  const [shouldShow, setShouldShow] = React.useState(false);

  React.useEffect(() => {
    if (condition) {
      setShouldShow(true);
    }
  }, [condition]);

  return shouldShow ? tourId : null;
}