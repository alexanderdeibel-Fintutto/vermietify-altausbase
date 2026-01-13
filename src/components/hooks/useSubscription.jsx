import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useSubscription() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
  });

  return useQuery({
    queryKey: ['subscription', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;

      const [subscriptions, plans, addons] = await Promise.all([
        base44.entities.UserSubscription.filter({ user_email: user.email }),
        base44.entities.SubscriptionPlan.list(),
        base44.entities.UserAddOn.filter({ user_email: user.email, status: 'active' })
      ]);

      const subscription = subscriptions[0];
      if (!subscription) return null;

      const plan = plans.find(p => p.id === subscription.plan_id);

      const now = new Date();
      const periodEnd = new Date(subscription.current_period_end);
      const trialEnd = subscription.trial_end ? new Date(subscription.trial_end) : null;

      const daysUntilRenewal = Math.ceil((periodEnd - now) / (1000 * 60 * 60 * 24));
      const daysLeftInTrial = trialEnd ? Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24)) : 0;

      // Monatliche Kosten berechnen
      let monthlySpend = subscription.billing_cycle === 'yearly' 
        ? Math.round(plan.price_yearly / 12)
        : plan.price_monthly;

      for (const addon of addons) {
        if (!addon.is_included_in_plan) {
          monthlySpend += addon.price_at_purchase;
        }
      }

      return {
        subscription,
        plan,
        addons,
        isActive: ['active', 'trialing'].includes(subscription.status),
        isTrial: subscription.status === 'trialing',
        isPastDue: subscription.status === 'past_due',
        isCanceled: subscription.status === 'canceled',
        daysUntilRenewal,
        daysLeftInTrial,
        monthlySpend,
        tierLevel: plan?.tier_level || 0,
      };
    },
    enabled: !!user?.email,
    staleTime: 60 * 1000,
  });
}