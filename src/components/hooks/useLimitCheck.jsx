import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useLimitCheck(limitCode) {
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

  const { data: limits = [] } = useQuery({
    queryKey: ['usageLimits'],
    queryFn: () => base44.entities.UsageLimit.list()
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

  const limit = limits.find(l => l.limit_code === limitCode);
  const userLimit = userLimits.find(ul => ul.limit_id === limit?.id);

  const checkLimit = () => {
    if (!limit || !userLimit) {
      return { allowed: true, remaining: Infinity };
    }

    const limitValue = userLimit.limit_value;
    const currentUsage = userLimit.current_usage;

    // -1 means unlimited
    if (limitValue === -1) {
      return { allowed: true, remaining: Infinity };
    }

    // 0 means feature disabled
    if (limitValue === 0) {
      return { allowed: false, remaining: 0 };
    }

    const allowed = currentUsage < limitValue;
    const remaining = limitValue - currentUsage;

    return {
      allowed,
      remaining,
      current: currentUsage,
      limit: limitValue,
      percentage: (currentUsage / limitValue) * 100
    };
  };

  return {
    ...checkLimit(),
    isLoading: !limit || !userLimit,
    subscription
  };
}