import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import PlanFeaturesList from './PlanFeaturesList';

export default function PlanComparisonCard({ 
  plan, 
  currentPlan = false,
  recommended = false,
  onSelect 
}) {
  return (
    <Card className={recommended ? 'vf-card-premium' : ''}>
      <CardHeader>
        {recommended && (
          <div className="vf-badge vf-badge-gradient mb-3">Empfohlen</div>
        )}
        <CardTitle className="vf-pricing-name">{plan.name}</CardTitle>
        <div className="vf-pricing-price">
          €{plan.price_monthly}
          <span className="vf-pricing-period">/Monat</span>
        </div>
        {plan.price_yearly && (
          <div className="text-sm text-[var(--vf-success-600)] font-medium">
            Spare 20% bei jährlicher Zahlung
          </div>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-sm text-[var(--theme-text-secondary)] mb-4">
          {plan.description}
        </p>

        <PlanFeaturesList features={plan.features} />

        {currentPlan ? (
          <Button variant="outline" className="w-full" disabled>
            Aktueller Plan
          </Button>
        ) : (
          <Button variant={recommended ? 'gradient' : 'primary'} className="w-full" onClick={onSelect}>
            {plan.price_monthly === 0 ? 'Kostenlos starten' : 'Plan wählen'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}