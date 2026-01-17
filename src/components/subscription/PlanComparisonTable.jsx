import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';

export default function PlanComparisonTable() {
  const plans = [
    { name: 'Starter', price: 19, buildings: 2, units: 10, features: ['basic'] },
    { name: 'Basic', price: 49, buildings: 5, units: 25, features: ['basic', 'advanced'] },
    { name: 'Pro', price: 99, buildings: 15, units: 75, features: ['basic', 'advanced', 'premium'] }
  ];

  const features = [
    { key: 'basic', label: 'Basis-Funktionen' },
    { key: 'advanced', label: 'Erweiterte Berichte' },
    { key: 'premium', label: 'KI-Assistent' }
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="p-4 text-left">Feature</th>
            {plans.map((plan) => (
              <th key={plan.name} className="p-4 text-center">
                <div className="font-bold">{plan.name}</div>
                <div className="text-2xl font-bold text-[var(--theme-primary)] my-2">€{plan.price}</div>
                <div className="text-xs text-[var(--theme-text-muted)]">pro Monat</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {features.map((feature) => (
            <tr key={feature.key} className="border-b">
              <td className="p-4 font-medium">{feature.label}</td>
              {plans.map((plan) => (
                <td key={plan.name} className="p-4 text-center">
                  {plan.features.includes(feature.key) ? (
                    <Check className="h-5 w-5 text-[var(--vf-success-500)] mx-auto" />
                  ) : (
                    <X className="h-5 w-5 text-[var(--theme-text-muted)] mx-auto" />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}