import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PlanCard({ 
  plan, 
  isCurrentPlan = false, 
  billingCycle = 'monthly',
  onSelect,
  className 
}) {
  const monthlyPrice = billingCycle === 'yearly' 
    ? Math.round(plan.price_yearly / 12) 
    : plan.price_monthly;

  const yearlyDiscount = plan.price_yearly 
    ? plan.price_monthly * 12 - plan.price_yearly 
    : 0;

  const features = plan.features_json ? JSON.parse(plan.features_json) : [];
  const limits = plan.limits_json ? JSON.parse(plan.limits_json) : {};

  const featureNames = {
    building_management: 'Objektverwaltung',
    tenant_management: 'Mieterverwaltung',
    contract_management: 'Vertragsverwaltung',
    basic_reports: 'Basis-Reports',
    advanced_reports: 'Erweiterte Reports',
    multi_user: 'Multi-User',
    api_access: 'API-Zugang'
  };

  return (
    <Card className={cn(
      "relative transition-all",
      plan.highlight && "border-slate-900 shadow-lg scale-105",
      isCurrentPlan && "border-emerald-500 bg-emerald-50/50",
      className
    )}>
      {plan.badge_text && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-slate-900 text-white">{plan.badge_text}</Badge>
        </div>
      )}

      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl">{plan.name}</CardTitle>
        <CardDescription className="text-sm">{plan.description}</CardDescription>
        
        <div className="mt-4">
          <div className="text-4xl font-light text-slate-900">
            {(monthlyPrice / 100).toFixed(2)}€
          </div>
          <div className="text-sm text-slate-600 mt-1">/Monat</div>
          
          {billingCycle === 'yearly' && yearlyDiscount > 0 && (
            <Badge variant="secondary" className="mt-2 bg-emerald-100 text-emerald-700">
              {(yearlyDiscount / 100).toFixed(2)}€ gespart/Jahr
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-4 border-t">
        {features.map(featureKey => (
          <div key={featureKey} className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{featureNames[featureKey] || featureKey}</span>
          </div>
        ))}

        {limits.objects && limits.objects !== -1 && (
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{limits.objects} Objekte</span>
          </div>
        )}

        {limits.objects === -1 && (
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Unbegrenzte Objekte</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-4">
        <Button
          className="w-full"
          variant={isCurrentPlan ? 'outline' : 'default'}
          disabled={isCurrentPlan}
          onClick={() => onSelect(plan)}
        >
          {isCurrentPlan ? 'Aktueller Plan' : 'Auswählen'}
        </Button>
      </CardFooter>
    </Card>
  );
}