import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useSubscription } from './useSubscription';

export function useAllLimits() {
  const { data: subscription, isLoading: subLoading } = useSubscription();

  return useQuery({
    queryKey: ['allLimits', subscription?.subscription?.id],
    queryFn: async () => {
      if (!subscription) return { limits: {} };

      const allLimits = await base44.entities.UsageLimit.list();
      const result = {};

      for (const limit of allLimits) {
        const planLimits = await base44.entities.PlanLimit.filter({
          plan_id: subscription.plan.id,
          limit_id: limit.id
        });

        const maxAllowed = planLimits[0]?.limit_value ?? 0;

        if (maxAllowed === -1) {
          result[limit.key] = {
            current: 0,
            max: -1,
            remaining: -1,
            percentage: 0,
            unlimited: true,
            name: limit.name
          };
          continue;
        }

        let currentCount = 0;

        if (limit.reset_period === 'never') {
          const entities = await base44.entities[limit.entity_to_count].filter({
            created_by: subscription.subscription.user_email
          });
          currentCount = entities.length;
        } else if (limit.reset_period === 'monthly') {
          const today = new Date();
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
          
          const logs = await base44.entities.UsageLog.filter({
            user_email: subscription.subscription.user_email,
            limit_key: limit.key,
            period_start: monthStart.toISOString().split('T')[0]
          });

          currentCount = logs[0]?.current_count || 0;
        }

        const remaining = Math.max(0, maxAllowed - currentCount);
        const percentage = maxAllowed > 0 ? Math.min(100, Math.round((currentCount / maxAllowed) * 100)) : 0;

        result[limit.key] = {
          current: currentCount,
          max: maxAllowed,
          remaining,
          percentage,
          unlimited: false,
          name: limit.name
        };
      }

      return { limits: result };
    },
    enabled: !subLoading && !!subscription,
    staleTime: 60 * 1000,
  });
}