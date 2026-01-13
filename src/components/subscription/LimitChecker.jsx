import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useLimitCheck(limitCode) {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
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
  const userLimit = userLimits.find(ul => {
    const l = limits.find(lim => lim.id === ul.limit_id);
    return l?.limit_code === limitCode;
  });

  const isAllowed = () => {
    if (!userLimit) return true;
    if (userLimit.limit_value === -1) return true; // Unlimited
    return userLimit.current_usage < userLimit.limit_value;
  };

  const getRemainingUsage = () => {
    if (!userLimit) return null;
    if (userLimit.limit_value === -1) return Infinity;
    return userLimit.limit_value - userLimit.current_usage;
  };

  const getUsagePercentage = () => {
    if (!userLimit || userLimit.limit_value === -1) return 0;
    return (userLimit.current_usage / userLimit.limit_value) * 100;
  };

  return {
    isAllowed: isAllowed(),
    remaining: getRemainingUsage(),
    current: userLimit?.current_usage || 0,
    limit: userLimit?.limit_value || 0,
    percentage: getUsagePercentage(),
    limitName: limit?.name,
    limitUnit: limit?.unit,
    isLoading: !user || !userLimit
  };
}

export function LimitGuard({ limitCode, children, fallback }) {
  const check = useLimitCheck(limitCode);

  if (check.isLoading) {
    return null;
  }

  if (!check.isAllowed) {
    return fallback || null;
  }

  return <>{children}</>;
}