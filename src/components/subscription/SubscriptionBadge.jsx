import React from 'react';
import { useSubscription } from '@/components/hooks/useSubscription';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function SubscriptionBadge({ className, showPlan = true, showStatus = true }) {
  const { data: subscription, isLoading } = useSubscription();

  if (isLoading) return null;
  if (!subscription) return null;

  const statusConfig = {
    trialing: { text: 'Testphase', variant: 'secondary' },
    active: { text: 'Aktiv', variant: 'default' },
    past_due: { text: 'Zahlung ausstehend', variant: 'destructive' },
    canceled: { text: 'Gekündigt', variant: 'outline' },
    unpaid: { text: 'Unbezahlt', variant: 'destructive' },
    paused: { text: 'Pausiert', variant: 'outline' },
  };

  const status = statusConfig[subscription.subscription.status] || statusConfig.active;

  return (
    <Badge variant={status.variant} className={cn("gap-1", className)}>
      {showPlan && subscription.plan.name}
      {showPlan && showStatus && ' • '}
      {showStatus && status.text}
    </Badge>
  );
}