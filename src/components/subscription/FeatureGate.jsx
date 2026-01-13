import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import UpgradePrompt from './UpgradePrompt';

export function FeatureGate({ 
  featureCode, 
  children, 
  fallback = null,
  showUpgradePrompt = true 
}) {
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

  const { data: feature } = useQuery({
    queryKey: ['feature', featureCode],
    queryFn: async () => {
      const features = await base44.entities.Feature.filter({ feature_code: featureCode });
      return features[0] || null;
    },
    enabled: !!featureCode
  });

  const { data: tierFeature } = useQuery({
    queryKey: ['tierFeature', subscription?.tier_id, feature?.id],
    queryFn: async () => {
      const tfs = await base44.entities.TierFeature.filter({
        tier_id: subscription.tier_id,
        feature_id: feature.id
      });
      return tfs[0] || null;
    },
    enabled: !!subscription?.tier_id && !!feature?.id
  });

  const hasAccess = tierFeature && tierFeature.inclusion_type === 'INCLUDED';

  if (!user || !subscription) {
    return null;
  }

  if (!hasAccess) {
    if (showUpgradePrompt) {
      return (
        <UpgradePrompt
          title="Feature nicht verfügbar"
          message="Upgraden Sie Ihren Plan um dieses Feature freizuschalten:"
          featureName={feature?.name}
        />
      );
    }
    return fallback;
  }

  return <>{children}</>;
}

export default FeatureGate;