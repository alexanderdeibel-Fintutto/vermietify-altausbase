import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Calendar, TrendingUp } from 'lucide-react';
import { differenceInDays, format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function SubscriptionWidget() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: subscription } = useQuery({
    queryKey: ['userSubscription', user?.email],
    queryFn: async () => {
      const subs = await base44.entities.UserSubscription.filter({ 
        user_email: user.email 
      });
      return subs[0];
    },
    enabled: !!user?.email
  });

  const { data: tier } = useQuery({
    queryKey: ['currentTier', subscription?.tier_id],
    queryFn: async () => {
      const tiers = await base44.entities.PricingTier.filter({ id: subscription.tier_id });
      return tiers[0];
    },
    enabled: !!subscription?.tier_id
  });

  if (!subscription || !tier) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Kein Abonnement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 mb-4">
            Wähle einen Plan um alle Features zu nutzen.
          </p>
          <Button asChild className="w-full">
            <Link to={createPageUrl('Pricing')}>
              Plan auswählen
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isTrial = subscription.status === 'TRIAL';
  const trialDaysLeft = isTrial && subscription.trial_end_date 
    ? differenceInDays(new Date(subscription.trial_end_date), new Date())
    : 0;

  const statusColors = {
    TRIAL: 'bg-blue-100 text-blue-700',
    ACTIVE: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-orange-100 text-orange-700'
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Crown className="h-5 w-5" />
            {tier.name}
          </CardTitle>
          <Badge className={statusColors[subscription.status]}>
            {subscription.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isTrial && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="text-blue-800">
                <strong>{trialDaysLeft} Tage</strong> Trial verbleibend
              </span>
            </div>
          </div>
        )}

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Monatlich:</span>
            <span className="font-medium">{(tier.price_monthly / 100).toFixed(2)}€</span>
          </div>
          {subscription.next_billing_date && (
            <div className="flex justify-between">
              <span className="text-slate-600">Nächste Rechnung:</span>
              <span className="font-medium">
                {format(new Date(subscription.next_billing_date), 'dd.MM.', { locale: de })}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild className="flex-1">
            <Link to={createPageUrl('MySubscription')}>
              Details
            </Link>
          </Button>
          <Button size="sm" asChild className="flex-1">
            <Link to={createPageUrl('Pricing')}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Upgrade
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}