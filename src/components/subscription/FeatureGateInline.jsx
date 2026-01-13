import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';

export default function FeatureGateInline({ 
  featureCode, 
  children,
  showBadge = true
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

  if (!hasAccess && showBadge) {
    return (
      <div className="inline-flex items-center gap-2 opacity-60 cursor-not-allowed">
        {children}
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
          <Crown className="h-3 w-3 mr-1" />
          PRO
        </Badge>
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return <>{children}</>;
}