import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useSubscription } from './useSubscription';

export function useUsageLimit(limitKey) {
  const { data: subscription, isLoading: subLoading } = useSubscription();

  return useQuery({
    queryKey: ['usageLimit', limitKey, subscription?.subscription?.id],
    queryFn: async () => {
      if (!subscription) return null;

      // Limit-Definition laden
      const limits = await base44.entities.UsageLimit.filter({ key: limitKey });
      if (!limits[0]) return null;
      const limit = limits[0];

      // Plan-Limit laden
      const planLimits = await base44.entities.PlanLimit.filter({
        plan_id: subscription.plan.id,
        limit_id: limit.id
      });

      const maxAllowed = planLimits[0]?.limit_value ?? 0;

      // Unlimited?
      if (maxAllowed === -1) {
        return {
          isLoading: false,
          current: 0,
          max: -1,
          remaining: -1,
          percentage: 0,
          unlimited: true,
          isAtLimit: false,
          isNearLimit: false,
          overageAllowed: limit.overage_allowed,
          overagePrice: limit.overage_price_per_unit,
          limitName: limit.name
        };
      }

      // Aktuelle Nutzung zählen
      let currentCount = 0;

      if (limit.reset_period === 'never') {
        // Absolute Zählung
        const entities = await base44.entities[limit.entity_to_count].filter({
          created_by: subscription.subscription.user_email
        });
        currentCount = entities.length;
      } else if (limit.reset_period === 'monthly') {
        // UsageLog prüfen für diesen Monat
        const today = new Date();
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        
        const logs = await base44.entities.UsageLog.filter({
          user_email: subscription.subscription.user_email,
          limit_key: limitKey,
          period_start: monthStart.toISOString().split('T')[0]
        });

        currentCount = logs[0]?.current_count || 0;
      }

      const remaining = Math.max(0, maxAllowed - currentCount);
      const percentage = maxAllowed > 0 ? Math.min(100, Math.round((currentCount / maxAllowed) * 100)) : 0;

      return {
        isLoading: false,
        current: currentCount,
        max: maxAllowed,
        remaining,
        percentage,
        unlimited: false,
        isAtLimit: currentCount >= maxAllowed,
        isNearLimit: percentage >= 80,
        overageAllowed: limit.overage_allowed,
        overagePrice: limit.overage_price_per_unit,
        limitName: limit.name
      };
    },
    enabled: !subLoading && !!subscription,
    staleTime: 30 * 1000,
  });
}