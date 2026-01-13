import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Crown, TrendingUp, AlertCircle, Check, Zap, ArrowRight } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { de } from 'date-fns/locale';

export default function MySubscription() {
  const queryClient = useQueryClient();

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

  const { data: product } = useQuery({
    queryKey: ['currentProduct', tier?.product_id],
    queryFn: async () => {
      const products = await base44.entities.Product.filter({ id: tier.product_id });
      return products[0];
    },
    enabled: !!tier?.product_id
  });

  const { data: tierLimits = [] } = useQuery({
    queryKey: ['tierLimits', subscription?.tier_id],
    queryFn: () => base44.entities.TierLimit.filter({ tier_id: subscription.tier_id }),
    enabled: !!subscription?.tier_id
  });

  const { data: limits = [] } = useQuery({
    queryKey: ['usageLimits'],
    queryFn: () => base44.entities.UsageLimit.list()
  });

  const { data: userLimits = [] } = useQuery({
    queryKey: ['userLimits', user?.email],
    queryFn: () => base44.entities.UserLimit.filter({ user_email: user.email }),
    enabled: !!user?.email
  });

  if (!subscription || !tier) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Du hast noch kein aktives Abonnement.{' '}
            <Link to={createPageUrl('Pricing')} className="underline font-medium">
              Jetzt Plan auswählen
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const statusColors = {
    TRIAL: 'bg-blue-100 text-blue-700',
    ACTIVE: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-orange-100 text-orange-700',
    EXPIRED: 'bg-red-100 text-red-700'
  };

  const isTrial = subscription.status === 'TRIAL';
  const trialDaysLeft = isTrial && subscription.trial_end_date 
    ? differenceInDays(new Date(subscription.trial_end_date), new Date())
    : 0;

  const monthlyPrice = subscription.billing_cycle === 'YEARLY' && tier.price_yearly
    ? (tier.price_yearly / 12 / 100).toFixed(2)
    : (tier.price_monthly / 100).toFixed(2);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-light text-slate-900">Mein Abonnement</h1>
        <p className="text-sm text-slate-600">Verwalte dein Abonnement und Nutzung</p>
      </div>

      {/* Trial Banner */}
      {isTrial && (
        <Alert className="border-blue-200 bg-blue-50">
          <Calendar className="h-4 w-4 text-blue-600" />
          <AlertDescription className="ml-2 text-blue-800">
            <strong>Trial-Phase:</strong> Noch {trialDaysLeft} Tage kostenlos testen
          </AlertDescription>
        </Alert>
      )}

      {/* Current Plan */}
      <Card className="border-2" style={{ borderColor: product?.color }}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Crown className="h-6 w-6" style={{ color: product?.color }} />
                <CardTitle className="text-xl">{tier.name}</CardTitle>
                <Badge className={statusColors[subscription.status]}>
                  {subscription.status}
                </Badge>
              </div>
              <p className="text-sm text-slate-600">{product?.name}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-light text-slate-900">
                {monthlyPrice}€
              </div>
              <div className="text-sm text-slate-500">pro Monat</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-slate-600">Abrechnung:</span>
              <span className="ml-2 font-medium">
                {subscription.billing_cycle === 'MONTHLY' ? 'Monatlich' : 'Jährlich'}
              </span>
            </div>
            {subscription.next_billing_date && (
              <div>
                <span className="text-slate-600">Nächste Zahlung:</span>
                <span className="ml-2 font-medium">
                  {format(new Date(subscription.next_billing_date), 'dd.MM.yyyy', { locale: de })}
                </span>
              </div>
            )}
            <div>
              <span className="text-slate-600">Auto-Verlängerung:</span>
              <span className="ml-2 font-medium">
                {subscription.auto_renew ? '✓ Aktiv' : '✗ Deaktiviert'}
              </span>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button variant="outline" asChild className="flex-1">
              <Link to={createPageUrl('Pricing')}>
                <TrendingUp className="h-4 w-4 mr-2" />
                Upgraden
              </Link>
            </Button>
            {subscription.status === 'ACTIVE' && (
              <Button variant="outline" className="flex-1">
                Kündigen
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Usage Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Nutzungs-Limits
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {tierLimits.map(tl => {
            const limit = limits.find(l => l.id === tl.limit_id);
            if (!limit || limit.limit_type === 'FEATURE_FLAG') return null;

            const userLimit = userLimits.find(ul => ul.limit_id === limit.id);
            const current = userLimit?.current_usage || 0;
            const max = tl.limit_value;
            const isUnlimited = max === -1;
            const percentage = isUnlimited ? 0 : Math.min((current / max) * 100, 100);
            const isWarning = percentage >= (limit.warning_threshold || 80);

            return (
              <div key={limit.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{limit.name}</span>
                  <span className={cn(
                    "font-medium",
                    isWarning && !isUnlimited && "text-orange-600"
                  )}>
                    {current} / {isUnlimited ? '∞' : max} {limit.unit}
                  </span>
                </div>
                {!isUnlimited && (
                  <Progress 
                    value={percentage} 
                    className={cn(isWarning && "bg-orange-100")}
                  />
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Feature Access */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Verfügbare Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-3">
            {tierLimits
              .filter(tl => {
                const limit = limits.find(l => l.id === tl.limit_id);
                return limit?.limit_type === 'FEATURE_FLAG' && tl.limit_value === 1;
              })
              .map(tl => {
                const limit = limits.find(l => l.id === tl.limit_id);
                return (
                  <div key={limit.id} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>{limit.name}</span>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}