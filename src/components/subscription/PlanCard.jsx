import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import CurrencyDisplay from '@/components/shared/CurrencyDisplay';

export default function PlanCard({ plan, isPopular, onSelect }) {
  return (
    <Card className={isPopular ? 'border-2 border-[var(--theme-primary)] relative' : ''}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="vf-badge vf-badge-gradient px-4">Beliebt</span>
        </div>
      )}
      
      <CardHeader>
        <CardTitle>{plan.name}</CardTitle>
        <div className="flex items-baseline gap-2">
          <CurrencyDisplay amount={plan.price} className="text-3xl font-bold" />
          <span className="text-sm text-[var(--theme-text-muted)]">/ Monat</span>
        </div>
      </CardHeader>

      <CardContent>
        <ul className="space-y-3">
          {plan.features?.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="h-4 w-4 text-[var(--vf-success-500)] mt-0.5 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <Button 
          variant={isPopular ? 'gradient' : 'outline'} 
          className="w-full"
          onClick={() => onSelect(plan)}
        >
          Plan wählen
        </Button>
      </CardFooter>
    </Card>
  );
}