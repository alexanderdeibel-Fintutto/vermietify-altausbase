import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, Zap } from 'lucide-react';
import { toast } from 'sonner';
import VermitifyLogo from '@/components/branding/VermitifyLogo';

export default function Billing() {
  const [loading, setLoading] = useState(null);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => base44.entities.SubscriptionPlan.filter({ is_active: true }, 'display_order')
  });

  const handleSelectPlan = async (plan, billingCycle) => {
    setLoading(`${plan.id}-${billingCycle}`);
    
    try {
      const response = await base44.functions.invoke('createStripeCheckoutSession', {
        plan_id: plan.id,
        billing_cycle: billingCycle
      });

      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      toast.error('Fehler beim Erstellen der Checkout-Session');
      setLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <VermitifyLogo size="lg" />
          </div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
            Wählen Sie Ihren Plan
          </h1>
          <p className="text-lg text-slate-600">Starten Sie mit dem perfekten Plan für Ihre Bedürfnisse</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const features = JSON.parse(plan.features || '[]');
            const isPopular = plan.internal_code === 'PRO';
            
            return (
              <Card key={plan.id} className={`relative ${isPopular ? 'border-2 border-orange-500 shadow-xl' : ''}`}>
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-1">
                      <Zap className="w-3 h-3 mr-1" />
                      Beliebteste Wahl
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="text-sm mt-2">{plan.description}</CardDescription>
                  <div className="mt-6">
                    <div className="text-4xl font-bold text-slate-900">
                      {plan.price_monthly}€
                      <span className="text-lg font-normal text-slate-600">/Monat</span>
                    </div>
                    {plan.price_yearly && (
                      <div className="text-sm text-slate-600 mt-2">
                        oder {plan.price_yearly}€/Jahr
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2 mb-6">
                    <div className="text-sm text-slate-600">
                      <strong>{plan.max_buildings === -1 ? 'Unbegrenzt' : plan.max_buildings}</strong> Gebäude
                    </div>
                    <div className="text-sm text-slate-600">
                      <strong>{plan.max_units === -1 ? 'Unbegrenzt' : plan.max_units}</strong> Einheiten
                    </div>
                  </div>

                  <ul className="space-y-2 mb-6">
                    {features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="space-y-2">
                    <Button
                      onClick={() => handleSelectPlan(plan, 'MONTHLY')}
                      className="w-full"
                      variant={isPopular ? 'default' : 'outline'}
                      disabled={loading === `${plan.id}-MONTHLY`}
                    >
                      {loading === `${plan.id}-MONTHLY` ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Monatlich wählen'
                      )}
                    </Button>

                    {plan.price_yearly && (
                      <Button
                        onClick={() => handleSelectPlan(plan, 'YEARLY')}
                        className="w-full"
                        variant="ghost"
                        disabled={loading === `${plan.id}-YEARLY`}
                      >
                        {loading === `${plan.id}-YEARLY` ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Jährlich wählen'
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}