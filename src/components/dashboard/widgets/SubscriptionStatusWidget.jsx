import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Crown, AlertTriangle, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function SubscriptionStatusWidget() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: subscription } = useQuery({
    queryKey: ['userSubscription', user?.email],
    queryFn: async () => {
      const subs = await base44.entities.UserSubscription.filter({ 
        user_email: user.email 
      });
      return subs[0] || null;
    },
    enabled: !!user?.email
  });

  const { data: tier } = useQuery({
    queryKey: ['currentTier', subscription?.tier_id],
    queryFn: async () => {
      return await base44.entities.PricingTier.get(subscription.tier_id);
    },
    enabled: !!subscription?.tier_id
  });

  const { data: userLimits = [] } = useQuery({
    queryKey: ['userLimits', user?.email],
    queryFn: async () => {
      return await base44.entities.UserLimit.filter({ 
        user_email: user.email 
      });
    },
    enabled: !!user?.email
  });

  if (!subscription || !tier) {
    return null;
  }

  const isTrialEnding = subscription.status === 'TRIAL' && subscription.trial_end_date;
  const daysLeft = isTrialEnding 
    ? Math.ceil((new Date(subscription.trial_end_date) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  const criticalLimits = userLimits.filter(ul => {
    if (ul.limit_value === -1) return false;
    const percentage = (ul.current_usage / ul.limit_value) * 100;
    return percentage >= 90;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg font-light">Ihr Abonnement</span>
          <Badge variant={subscription.status === 'ACTIVE' ? 'default' : 'secondary'}>
            {subscription.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-light text-slate-900">{tier.name}</div>
            <div className="text-sm text-slate-600">
              {tier.price_monthly === 0 ? 'Kostenlos' : `${(tier.price_monthly / 100).toFixed(2)}€/Monat`}
            </div>
          </div>
          <Crown className="h-10 w-10 text-yellow-500" />
        </div>

        {isTrialEnding && daysLeft !== null && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-yellow-800">
              <AlertTriangle className="h-4 w-4" />
              <span>
                Trial endet in <strong>{daysLeft} Tagen</strong>
              </span>
            </div>
          </div>
        )}

        {criticalLimits.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-slate-700">Limit-Warnung</div>
            {criticalLimits.slice(0, 2).map(ul => {
              const percentage = (ul.current_usage / ul.limit_value) * 100;
              return (
                <div key={ul.id} className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Nutzung</span>
                    <span>{ul.current_usage}/{ul.limit_value}</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </div>
        )}

        <div className="flex gap-2">
          <Link to={createPageUrl('MySubscription')} className="flex-1">
            <Button variant="outline" className="w-full" size="sm">
              Details
            </Button>
          </Link>
          <Link to={createPageUrl('Pricing')} className="flex-1">
            <Button className="w-full" size="sm">
              <TrendingUp className="h-4 w-4 mr-2" />
              Upgraden
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}