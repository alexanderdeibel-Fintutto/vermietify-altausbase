import React from 'react';
import { Link } from 'react-router-dom';
import { useSubscription } from '@/components/hooks/useSubscription';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SubscriptionBadge } from '@/components/subscription/SubscriptionBadge';
import { Progress } from '@/components/ui/progress';
import { Settings, TrendingUp, Calendar } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function SubscriptionOverviewWidget() {
  const { data: subscription, isLoading } = useSubscription();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-slate-200 rounded w-3/4" />
            <div className="h-4 bg-slate-200 rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!subscription) return null;

  const trialProgress = subscription.isTrial 
    ? 100 - (subscription.daysLeftInTrial / 14 * 100)
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Abonnement</CardTitle>
          <Button variant="ghost" size="icon" asChild>
            <Link to={createPageUrl('SubscriptionSettings')}>
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">Aktueller Plan</span>
          <SubscriptionBadge showStatus={false} />
        </div>

        {subscription.isTrial && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Testphase</span>
              <span className="font-medium text-blue-600">
                {subscription.daysLeftInTrial} Tage übrig
              </span>
            </div>
            <Progress value={trialProgress} className="h-1.5 [&>div]:bg-blue-500" />
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span className="text-slate-600">Nächste Zahlung</span>
          </div>
          <span className="font-medium">
            {format(new Date(subscription.subscription.current_period_end), 'dd.MM.yy', { locale: de })}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm pt-3 border-t">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-slate-400" />
            <span className="text-slate-600">Monatlich</span>
          </div>
          <span className="text-lg font-light">
            {(subscription.monthlySpend / 100).toFixed(2)}€
          </span>
        </div>

        {subscription.addons.length > 0 && (
          <div className="text-xs text-slate-500">
            + {subscription.addons.length} Add-On{subscription.addons.length > 1 ? 's' : ''}
          </div>
        )}
      </CardContent>
    </Card>
  );
}