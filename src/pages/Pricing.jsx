import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { PlanCard } from '@/components/subscription/PlanCard';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me().catch(() => null)
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['subscriptionPlans'],
    queryFn: () => base44.entities.SubscriptionPlan.filter({ is_active: true })
  });

  const { data: addons = [] } = useQuery({
    queryKey: ['subscriptionAddons'],
    queryFn: () => base44.entities.SubscriptionAddOn.filter({ is_active: true })
  });

  const { data: currentSubscription } = useQuery({
    queryKey: ['userSubscription', user?.email],
    queryFn: () => base44.entities.UserSubscription.filter({ user_email: user.email }),
    enabled: !!user?.email
  });

  const currentPlanId = currentSubscription?.[0]?.plan_id;

  const handleCheckout = async (plan) => {
    if (!user) {
      toast.error('Bitte melde dich an, um fortzufahren');
      return;
    }

    try {
      const origin = window.location.origin;
      const response = await base44.functions.invoke('stripe/createCheckoutSession', {
        plan_id: plan.id,
        addon_ids: selectedAddons,
        billing_cycle: billingCycle,
        success_url: `${origin}/settings/subscription`,
        cancel_url: `${origin}/pricing`
      });

      if (response.data?.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Fehler beim Checkout');
    }
  };

  const sortedPlans = [...plans].sort((a, b) => a.sort_order - b.sort_order);
  const categorizedAddons = addons.reduce((acc, addon) => {
    if (!acc[addon.category]) acc[addon.category] = [];
    acc[addon.category].push(addon);
    return acc;
  }, {});

  const categoryNames = {
    integration: 'Integrationen',
    feature: 'Features',
    limit_extension: 'Limit-Erweiterungen',
    support: 'Support'
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12 px-6">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-light text-slate-900">
            Preise & Pläne
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Wähle den passenden Plan für deine Immobilien- und Vermögensverwaltung
          </p>

          <div className="flex justify-center pt-4">
            <Tabs value={billingCycle} onValueChange={setBillingCycle}>
              <TabsList>
                <TabsTrigger value="monthly">Monatlich</TabsTrigger>
                <TabsTrigger value="yearly">
                  Jährlich
                  <Badge variant="secondary" className="ml-2 bg-emerald-100 text-emerald-700">
                    2 Monate gratis
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-6">
          {sortedPlans.map(plan => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrentPlan={plan.id === currentPlanId}
              billingCycle={billingCycle}
              onSelect={handleCheckout}
            />
          ))}
        </div>

        {/* Add-Ons */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-light text-slate-900 mb-2">
              Optionale Add-Ons
            </h2>
            <p className="text-slate-600">
              Erweitere deinen Plan mit zusätzlichen Funktionen
            </p>
          </div>

          {Object.entries(categorizedAddons).map(([category, categoryAddons]) => (
            <div key={category}>
              <h3 className="text-lg font-medium text-slate-800 mb-4">
                {categoryNames[category] || category}
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryAddons.map(addon => (
                  <AddonCard key={addon.id} addon={addon} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-center">Häufige Fragen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FAQItem 
              question="Kann ich meinen Plan jederzeit wechseln?"
              answer="Ja, du kannst jederzeit upgraden oder downgraden. Die Abrechnung erfolgt anteilig."
            />
            <FAQItem 
              question="Was passiert nach der Testphase?"
              answer="Nach 14 Tagen wird automatisch die gewählte Zahlungsmethode belastet. Du kannst vorher jederzeit kündigen."
            />
            <FAQItem 
              question="Sind die Preise Netto oder Brutto?"
              answer="Alle Preise verstehen sich zzgl. MwSt."
            />
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

function AddonCard({ addon }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">{addon.name}</CardTitle>
            <CardDescription className="text-xs">{addon.description}</CardDescription>
          </div>
          <div className="text-2xl">{addon.icon === 'Building2' ? '🏦' : addon.icon === 'MessageCircle' ? '💬' : '📊'}</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <span className="text-lg font-light">
            ab {(addon.base_price_monthly / 100).toFixed(2)}€
          </span>
          <Button size="sm" variant="outline">
            <Zap className="h-3 w-3 mr-1" />
            Hinzufügen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function FAQItem({ question, answer }) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-slate-900">{question}</h4>
      <p className="text-sm text-slate-600">{answer}</p>
    </div>
  );
}