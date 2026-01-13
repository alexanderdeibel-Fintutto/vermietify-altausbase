import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useSubscription } from './useSubscription';

export function useFeatureAccess(featureKey) {
  const { data: subscription, isLoading: subLoading } = useSubscription();

  return useQuery({
    queryKey: ['featureAccess', featureKey, subscription?.subscription?.id],
    queryFn: async () => {
      // Kein Abo = kein Zugriff
      if (!subscription?.isActive) {
        return { hasAccess: false, reason: 'no_subscription', currentPlanLevel: 0 };
      }

      // Feature laden
      const features = await base44.entities.Feature.filter({ key: featureKey });
      if (!features[0]) {
        return { hasAccess: false, reason: 'feature_not_found', currentPlanLevel: subscription.tierLevel };
      }

      const feature = features[0];

      // Core Feature = immer erlaubt
      if (feature.is_core) {
        return { hasAccess: true, reason: 'granted', currentPlanLevel: subscription.tierLevel };
      }

      // Plan-Level Check
      if (feature.requires_plan_level) {
        if (subscription.tierLevel >= feature.requires_plan_level) {
          return { hasAccess: true, reason: 'granted', currentPlanLevel: subscription.tierLevel };
        }
        return {
          hasAccess: false,
          reason: 'plan_upgrade_required',
          requiredPlanLevel: feature.requires_plan_level,
          currentPlanLevel: subscription.tierLevel
        };
      }

      // Add-On Check
      if (feature.requires_addon) {
        // User hat Add-On?
        const addons = await base44.entities.SubscriptionAddOn.filter({ slug: feature.requires_addon });
        const addon = addons[0];

        if (addon) {
          const userAddon = subscription.addons.find(a => a.addon_id === addon.id);
          if (userAddon) {
            return { hasAccess: true, reason: 'granted', currentPlanLevel: subscription.tierLevel };
          }

          // Im Plan inklusive?
          const pricings = await base44.entities.PlanAddOnPricing.filter({
            plan_id: subscription.plan.id,
            addon_id: addon.id,
            is_included: true
          });

          if (pricings[0]) {
            return { hasAccess: true, reason: 'granted', currentPlanLevel: subscription.tierLevel };
          }

          return {
            hasAccess: false,
            reason: 'addon_required',
            requiredAddon: feature.requires_addon,
            currentPlanLevel: subscription.tierLevel
          };
        }
      }

      return { hasAccess: false, reason: 'plan_upgrade_required', currentPlanLevel: subscription.tierLevel };
    },
    enabled: !subLoading && !!subscription,
    staleTime: 2 * 60 * 1000,
  });
}