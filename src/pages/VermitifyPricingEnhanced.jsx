import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function VermitifyPricingEnhanced() {
  const plans = [
    {
      name: 'Starter',
      price: 29,
      description: 'Perfekt für private Vermieter',
      features: [
        'Bis zu 3 Objekte',
        'Unbegrenzte Einheiten',
        'Mietverträge generieren',
        'Betriebskostenabrechnungen',
        'Basis-Support'
      ],
      highlighted: false
    },
    {
      name: 'Professional',
      price: 79,
      description: 'Für professionelle Vermieter',
      features: [
        'Unbegrenzte Objekte',
        'Anlage V & ELSTER',
        'Mieter-Portal',
        'Banking-Integration',
        'Priority Support',
        'API-Zugang'
      ],
      highlighted: true
    },
    {
      name: 'Business',
      price: 199,
      description: 'Für Hausverwaltungen',
      features: [
        'Alles aus Professional',
        'Multi-Mandanten',
        'White-Label',
        'Dedizierter Support',
        'Custom-Integration',
        'Schulungen'
      ],
      highlighted: false
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="vf-pricing">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-4">Preise</h1>
            <p className="text-xl text-[var(--vf-neutral-600)]">
              Transparente Preise. Keine versteckten Kosten.
            </p>
          </div>

          <div className="vf-pricing-cards">
            {plans.map((plan, index) => (
              <div 
                key={index}
                className={`vf-pricing-card ${plan.highlighted ? 'vf-pricing-card-highlighted' : ''}`}
              >
                {plan.highlighted && (
                  <div className="text-center mb-4">
                    <span className="vf-badge vf-badge-gradient">Beliebtester Plan</span>
                  </div>
                )}
                <h3 className="vf-pricing-name">{plan.name}</h3>
                <div className="mb-2">
                  <span className="vf-pricing-price">€{plan.price}</span>
                  <span className="vf-pricing-period">/Monat</span>
                </div>
                <p className="text-sm text-[var(--vf-neutral-600)] mb-6">{plan.description}</p>
                
                <ul className="vf-pricing-features">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="vf-pricing-feature">
                      <Check className="vf-pricing-feature-check h-5 w-5" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button 
                  variant={plan.highlighted ? 'gradient' : 'outline'}
                  className="w-full mt-6"
                >
                  Jetzt starten
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
            <p className="text-[var(--vf-neutral-600)] mb-4">
              Alle Pläne mit 14 Tagen kostenloser Testphase
            </p>
            <Link to="/contact" className="text-[var(--theme-primary)] hover:underline">
              Fragen? Kontaktieren Sie uns →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}