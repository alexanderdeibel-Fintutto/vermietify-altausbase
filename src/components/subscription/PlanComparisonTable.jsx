import React from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PlanComparisonTable({ plans = [], onSelectPlan }) {
  const features = [
    { key: 'max_buildings', label: 'Objekte' },
    { key: 'max_units', label: 'Einheiten' },
    { key: 'basic_management', label: 'Basis-Verwaltung' },
    { key: 'free_tools', label: 'Kostenlose Tools' },
    { key: 'anlage_v', label: 'Anlage V Export' },
    { key: 'bk_automation', label: 'BK-Abrechnung' },
    { key: 'letterxpress', label: 'LetterXpress' },
    { key: 'api_access', label: 'API-Zugang' },
    { key: 'priority_support', label: 'Priority Support' }
  ];

  const hasFeature = (plan, featureKey) => {
    const planFeatures = typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features;
    return planFeatures.includes(featureKey);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-4">Feature</th>
            {plans.map((plan) => (
              <th key={plan.id} className="text-center p-4 min-w-[150px]">
                <div className="font-bold">{plan.name}</div>
                <div className="text-lg font-bold text-[var(--vf-primary-600)] mt-1">
                  €{plan.price_monthly}
                </div>
                <div className="text-xs text-[var(--theme-text-muted)]">/Monat</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {features.map((feature) => (
            <tr key={feature.key} className="border-b">
              <td className="p-4 font-medium">{feature.label}</td>
              {plans.map((plan) => (
                <td key={plan.id} className="text-center p-4">
                  {feature.key === 'max_buildings' ? (
                    <span>{plan.max_buildings === -1 ? '∞' : plan.max_buildings}</span>
                  ) : feature.key === 'max_units' ? (
                    <span>{plan.max_units === -1 ? '∞' : plan.max_units}</span>
                  ) : hasFeature(plan, feature.key) ? (
                    <Check className="h-5 w-5 text-[var(--vf-success-500)] mx-auto" />
                  ) : (
                    <X className="h-5 w-5 text-[var(--vf-neutral-300)] mx-auto" />
                  )}
                </td>
              ))}
            </tr>
          ))}
          <tr>
            <td className="p-4"></td>
            {plans.map((plan) => (
              <td key={plan.id} className="text-center p-4">
                <Button 
                  variant={plan.internal_code === 'PRO' ? 'gradient' : 'primary'}
                  onClick={() => onSelectPlan(plan)}
                  className="w-full"
                >
                  Wählen
                </Button>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}