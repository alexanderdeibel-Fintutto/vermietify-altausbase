import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Crown } from 'lucide-react';

export default function PlanComparisonTable({ productId, onSelectPlan, currentTierId }) {
  const { data: tiers = [] } = useQuery({
    queryKey: ['pricingTiers', productId],
    queryFn: async () => {
      const allTiers = await base44.entities.PricingTier.filter({ 
        product_id: productId,
        is_active: true 
      });
      return allTiers.sort((a, b) => a.sort_order - b.sort_order);
    },
    enabled: !!productId
  });

  const { data: features = [] } = useQuery({
    queryKey: ['features'],
    queryFn: () => base44.entities.Feature.list()
  });

  const { data: tierFeatures = [] } = useQuery({
    queryKey: ['tierFeatures'],
    queryFn: () => base44.entities.TierFeature.list()
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['featureGroups'],
    queryFn: () => base44.entities.FeatureGroup.list()
  });

  const getFeaturesByGroup = () => {
    return groups.map(group => {
      const groupFeatures = features
        .filter(f => f.group_id === group.id && f.is_active)
        .sort((a, b) => a.sort_order - b.sort_order);
      return { group, features: groupFeatures };
    }).filter(g => g.features.length > 0);
  };

  const getTierFeatureStatus = (tierId, featureId) => {
    const tf = tierFeatures.find(tf => tf.tier_id === tierId && tf.feature_id === featureId);
    return tf || null;
  };

  const groupedFeatures = getFeaturesByGroup();

  return (
    <div className="space-y-8">
      {/* Tier Headers */}
      <div className="grid grid-cols-4 gap-4">
        <div></div>
        {tiers.map(tier => (
          <Card key={tier.id} className={tier.is_popular ? 'border-slate-800 border-2' : ''}>
            <CardHeader className="text-center pb-3">
              <div className="space-y-2">
                {tier.badge_text && (
                  <Badge className="mx-auto">{tier.badge_text}</Badge>
                )}
                <CardTitle className="text-lg">{tier.name}</CardTitle>
                <div className="text-3xl font-light">
                  {tier.price_monthly === 0 ? (
                    'Gratis'
                  ) : (
                    <>{(tier.price_monthly / 100).toFixed(2)}€</>
                  )}
                </div>
                <p className="text-xs text-slate-600">pro Monat</p>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {currentTierId === tier.id ? (
                <Button variant="outline" className="w-full" disabled>
                  <Crown className="h-4 w-4 mr-2" />
                  Aktuell
                </Button>
              ) : (
                <Button 
                  onClick={() => onSelectPlan(tier)}
                  className="w-full"
                  variant={tier.is_popular ? 'default' : 'outline'}
                >
                  Wählen
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Feature Comparison */}
      {groupedFeatures.map(({ group, features: groupFeatures }) => (
        <div key={group.id} className="space-y-3">
          <h3 className="text-sm font-medium text-slate-700">{group.name}</h3>
          <div className="space-y-2">
            {groupFeatures.map(feature => (
              <div key={feature.id} className="grid grid-cols-4 gap-4 items-center py-2 border-b border-slate-100">
                <div className="text-sm text-slate-700">{feature.name}</div>
                {tiers.map(tier => {
                  const status = getTierFeatureStatus(tier.id, feature.id);
                  
                  return (
                    <div key={tier.id} className="flex justify-center">
                      {!status || status.inclusion_type === 'EXCLUDED' ? (
                        <X className="h-5 w-5 text-slate-300" />
                      ) : status.inclusion_type === 'INCLUDED' ? (
                        <Check className="h-5 w-5 text-green-600" />
                      ) : (
                        <span className="text-xs text-slate-500">+</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}