import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useLimitChecker() {
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

  const checkLimit = async (entityType) => {
    if (!plan) return { allowed: false, reason: 'Plan not found' };

    const entities = await base44.entities[entityType].list();
    const current = entities.length;

    const limitMap = {
      Building: plan.max_buildings,
      Unit: plan.max_units
    };

    const max = limitMap[entityType];
    
    if (max === -1) return { allowed: true };
    if (current >= max) return { allowed: false, current, max };
    
    return { allowed: true, current, max };
  };

  return { checkLimit, plan };
}