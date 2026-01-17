import React from 'react';
import { Check } from 'lucide-react';

export default function PlanFeaturesList({ features = [] }) {
  const featureLabels = {
    'basic_management': 'Basis-Verwaltung',
    'free_tools': '9 kostenlose Tools',
    'mobile_app': 'Mobile App',
    'unlimited_buildings': 'Unbegrenzt Objekte',
    'anlage_v': 'Anlage V Export',
    'bk_automation': 'BK-Abrechnung automatisch',
    'letterxpress': 'LetterXpress Versand',
    'api_access': 'API-Zugang',
    'email_support': 'E-Mail-Support',
    'multi_mandant': 'Multi-Mandanten',
    'team_5_users': '5 Team-Mitglieder',
    'white_label': 'White-Label',
    'api_advanced': 'Erweiterte API',
    'priority_support': 'Priority Support',
    'onboarding': 'Onboarding-Beratung',
    'sla': 'SLA-Garantie'
  };

  const parsedFeatures = typeof features === 'string' ? JSON.parse(features) : features;

  return (
    <ul className="vf-pricing-features">
      {parsedFeatures.map((feature) => (
        <li key={feature} className="vf-pricing-feature">
          <Check className="vf-pricing-feature-check h-5 w-5" />
          <span>{featureLabels[feature] || feature}</span>
        </li>
      ))}
    </ul>
  );
}