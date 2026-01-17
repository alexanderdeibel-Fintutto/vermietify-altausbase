import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PlanFeaturesList from './PlanFeaturesList';
import { Check } from 'lucide-react';

export default function PlanCard({ 
  plan, 
  isCurrent = false, 
  onSelect,
  highlighted = false 
}) {
  return (
    <Card className={highlighted ? 'vf-card-premium' : ''}>
      <CardHeader>
        {highlighted && (
          <div className="vf-badge vf-badge-gradient mb-2">Beliebteste Wahl</div>
        )}
        <CardTitle>{plan.name}</CardTitle>
        <div className="mt-4">
          <div className="text-4xl font-bold">
            €{plan.price_monthly}
            <span className="text-lg font-normal text-[var(--theme-text-muted)]">/Monat</span>
          </div>
          {plan.price_yearly && (
            <div className="text-sm text-[var(--vf-success-600)] mt-1">
              oder €{plan.price_yearly}/Jahr (20% sparen)
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {plan.description && (
          <p className="text-sm text-[var(--theme-text-secondary)] mb-4">
            {plan.description}
          </p>
        )}

        <div className="space-y-2 mb-6">
          <div className="text-sm font-medium">Limits:</div>
          <div className="text-sm text-[var(--theme-text-secondary)]">
            {plan.max_buildings === -1 ? '∞' : plan.max_buildings} Objekte
          </div>
          <div className="text-sm text-[var(--theme-text-secondary)]">
            {plan.max_units === -1 ? '∞' : plan.max_units} Einheiten
          </div>
        </div>

        <PlanFeaturesList features={plan.features} />

        <Button
          variant={highlighted ? 'gradient' : 'primary'}
          className="w-full mt-6"
          onClick={() => onSelect(plan)}
          disabled={isCurrent}
        >
          {isCurrent ? 'Aktueller Plan' : plan.price_monthly === 0 ? 'Kostenlos starten' : 'Plan wählen'}
        </Button>
      </CardContent>
    </Card>
  );
}