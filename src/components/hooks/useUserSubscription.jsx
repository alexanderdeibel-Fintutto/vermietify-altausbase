import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useUserSubscription() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: subscription, isLoading } = useQuery({
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
    queryKey: ['userTier', subscription?.tier_id],
    queryFn: async () => {
      const tiers = await base44.entities.PricingTier.filter({ 
        id: subscription.tier_id 
      });
      return tiers[0];
    },
    enabled: !!subscription?.tier_id
  });

  const { data: tierLimits = [] } = useQuery({
    queryKey: ['tierLimits', subscription?.tier_id],
    queryFn: () => base44.entities.TierLimit.filter({ 
      tier_id: subscription.tier_id 
    }),
    enabled: !!subscription?.tier_id
  });

  const { data: tierFeatures = [] } = useQuery({
    queryKey: ['tierFeatures', subscription?.tier_id],
    queryFn: () => base44.entities.TierFeature.filter({ 
      tier_id: subscription.tier_id 
    }),
    enabled: !!subscription?.tier_id
  });

  // Check if user has access to a feature
  const hasFeature = (featureCode) => {
    if (!tierFeatures.length) return false;
    const feature = tierFeatures.find(tf => {
      // Would need to lookup feature by code - simplified for now
      return tf.inclusion_type === 'INCLUDED';
    });
    return !!feature;
  };

  // Get limit value for a specific limit
  const getLimit = (limitCode) => {
    const limit = tierLimits.find(tl => {
      // Would need to lookup limit by code - simplified
      return tl;
    });
    return limit?.limit_value ?? 0;
  };

  return {
    subscription,
    tier,
    tierLimits,
    tierFeatures,
    hasFeature,
    getLimit,
    isLoading,
    isTrial: subscription?.status === 'TRIAL',
    isActive: subscription?.status === 'ACTIVE',
    isCancelled: subscription?.status === 'CANCELLED'
  };
}