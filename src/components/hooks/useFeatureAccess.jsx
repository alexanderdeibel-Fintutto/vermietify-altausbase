import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useFeatureAccess(featureCode) {
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

  const { data: features = [] } = useQuery({
    queryKey: ['features'],
    queryFn: () => base44.entities.Feature.list()
  });

  const { data: tierFeatures = [] } = useQuery({
    queryKey: ['tierFeatures', subscription?.tier_id],
    queryFn: async () => {
      return await base44.entities.TierFeature.filter({ 
        tier_id: subscription.tier_id 
      });
    },
    enabled: !!subscription?.tier_id
  });

  const feature = features.find(f => f.feature_code === featureCode);
  const tierFeature = tierFeatures.find(tf => tf.feature_id === feature?.id);

  const hasAccess = () => {
    if (!feature || !tierFeature) {
      return {
        allowed: false,
        reason: 'FEATURE_NOT_FOUND',
        message: 'Feature nicht verfügbar'
      };
    }

    if (tierFeature.inclusion_type === 'EXCLUDED') {
      return {
        allowed: false,
        reason: 'FEATURE_EXCLUDED',
        message: 'Feature nicht in Ihrem Plan enthalten'
      };
    }

    if (tierFeature.inclusion_type === 'AVAILABLE') {
      return {
        allowed: false,
        reason: 'FEATURE_AVAILABLE_FOR_PURCHASE',
        message: 'Feature kann hinzugebucht werden'
      };
    }

    if (tierFeature.inclusion_type === 'INCLUDED') {
      return {
        allowed: true,
        quantityLimit: tierFeature.quantity_limit
      };
    }

    return {
      allowed: false,
      reason: 'UNKNOWN',
      message: 'Status unbekannt'
    };
  };

  return {
    ...hasAccess(),
    isLoading: !feature || !subscription,
    subscription,
    feature,
    tierFeature
  };
}