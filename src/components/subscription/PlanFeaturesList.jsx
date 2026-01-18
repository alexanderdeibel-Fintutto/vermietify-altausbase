import React from 'react';
import { Check, X } from 'lucide-react';

export default function PlanFeaturesList({ features = [], included = [] }) {
  return (
    <ul className="space-y-2">
      {features.map((feature, index) => {
        const isIncluded = included.includes(feature.key);
        return (
          <li key={index} className="flex items-center gap-2">
            {isIncluded ? (
              <Check className="h-4 w-4 text-[var(--vf-success-500)] flex-shrink-0" />
            ) : (
              <X className="h-4 w-4 text-[var(--theme-text-muted)] flex-shrink-0" />
            )}
            <span className={`text-sm ${!isIncluded && 'text-[var(--theme-text-muted)]'}`}>
              {feature.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}