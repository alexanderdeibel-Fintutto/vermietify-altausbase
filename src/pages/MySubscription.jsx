import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import SubscriptionBadge from '@/components/subscription/SubscriptionBadge';
import UsageMeter from '@/components/subscription/UsageMeter';
import { CreditCard, Calendar, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function MySubscription() {
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const subs = await base44.entities.UserSubscription.filter({ user_email: user.email });
      return subs[0];
    },
    enabled: !!user
  });

  const { data: plan } = useQuery({
    queryKey: ['plan', subscription?.plan_id],
    queryFn: () => base44.entities.SubscriptionPlan.get(subscription.plan_id),
    enabled: !!subscription?.plan_id
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: () => base44.entities.Unit.list()
  });

  if (!subscription || !plan) {
    return <div className="p-6">Lädt...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Mein Abonnement</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Aktueller Plan</CardTitle>
              <SubscriptionBadge planName={plan.internal_code} status={subscription.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[var(--theme-text-secondary)]">Tarif</span>
              <span className="font-semibold text-xl">{plan.name}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[var(--theme-text-secondary)]">Preis</span>
              <span className="font-semibold">
                €{plan.price_monthly}/Monat
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[var(--theme-text-muted)]" />
                <span className="text-[var(--theme-text-secondary)]">Nächste Abrechnung</span>
              </div>
              <span className="font-medium">
                {new Date(subscription.next_billing_date).toLocaleDateString('de-DE')}
              </span>
            </div>

            {subscription.status === 'TRIAL' && (
              <div className="flex items-center gap-2 p-3 bg-[var(--vf-warning-50)] rounded-lg border border-[var(--vf-warning-200)]">
                <AlertCircle className="h-5 w-5 text-[var(--vf-warning-600)]" />
                <span className="text-sm text-[var(--vf-warning-700)]">
                  Testphase endet am {new Date(subscription.trial_end_date).toLocaleDateString('de-DE')}
                </span>
              </div>
            )}

            <div className="pt-4">
              <Link to={createPageUrl('Pricing')}>
                <Button variant="gradient" className="w-full">
                  Plan upgraden
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nutzung</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <UsageMeter
              current={buildings.length}
              max={plan.max_buildings}
              label="Objekte"
            />

            <UsageMeter
              current={units.length}
              max={plan.max_units}
              label="Einheiten"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Zahlungsmethode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-[var(--theme-text-secondary)]">
                {subscription.payment_method === 'CREDIT_CARD' ? 'Kreditkarte' :
                 subscription.payment_method === 'SEPA' ? 'SEPA-Lastschrift' :
                 subscription.payment_method === 'INVOICE' ? 'Rechnung' : 'Keine'}
              </span>
              <Button variant="outline" size="sm">Ändern</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}