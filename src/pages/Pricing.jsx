import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Zap, Crown, Rocket } from 'lucide-react';
import { cn } from "@/lib/utils";
import { toast } from 'sonner';

export default function Pricing() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [billingCycle, setBillingCycle] = useState('MONTHLY');

  const { data: products = [] } = useQuery({
    queryKey: ['activeProducts'],
    queryFn: async () => {
      const prods = await base44.entities.Product.filter({ is_active: true });
      return prods.sort((a, b) => a.sort_order - b.sort_order);
    }
  });

  const { data: tiers = [] } = useQuery({
    queryKey: ['pricingTiers', selectedProduct?.id],
    queryFn: async () => {
      const allTiers = await base44.entities.PricingTier.filter({ 
        product_id: selectedProduct.id,
        is_active: true 
      });
      return allTiers.sort((a, b) => a.tier_level - b.tier_level);
    },
    enabled: !!selectedProduct
  });

  const { data: allFeatures = [] } = useQuery({
    queryKey: ['features'],
    queryFn: () => base44.entities.Feature.list('-sort_order')
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['featureGroups'],
    queryFn: () => base44.entities.FeatureGroup.list('-sort_order')
  });

  const { data: tierFeatures = [] } = useQuery({
    queryKey: ['allTierFeatures'],
    queryFn: () => base44.entities.TierFeature.list(),
    enabled: tiers.length > 0
  });

  const { data: productFeatures = [] } = useQuery({
    queryKey: ['productFeatures', selectedProduct?.id],
    queryFn: () => base44.entities.ProductFeature.filter({ product_id: selectedProduct.id }),
    enabled: !!selectedProduct
  });

  React.useEffect(() => {
    if (products.length > 0 && !selectedProduct) {
      setSelectedProduct(products[0]);
    }
  }, [products, selectedProduct]);

  const productFeatureIds = new Set(productFeatures.map(pf => pf.feature_id));
  const relevantFeatures = allFeatures.filter(f => productFeatureIds.has(f.id));

  const getFeatureInTier = (tierId, featureId) => {
    return tierFeatures.find(tf => tf.tier_id === tierId && tf.feature_id === featureId);
  };

  const handleSelectPlan = async (tier) => {
    toast.success(`${tier.name} ausgewählt - Weiterleitung zur Zahlung...`);
  };

  if (!selectedProduct) {
    return <div className="p-6">Lade...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-light text-slate-900">
            Wähle deinen Plan
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            {selectedProduct.description}
          </p>

          {/* Product Tabs */}
          {products.length > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              {products.map(p => (
                <Button
                  key={p.id}
                  variant={selectedProduct.id === p.id ? 'default' : 'outline'}
                  onClick={() => setSelectedProduct(p)}
                  style={selectedProduct.id === p.id ? { backgroundColor: p.color } : {}}
                >
                  {p.name}
                </Button>
              ))}
            </div>
          )}

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 pt-4">
            <button
              onClick={() => setBillingCycle('MONTHLY')}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition",
                billingCycle === 'MONTHLY' 
                  ? 'bg-slate-900 text-white' 
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Monatlich
            </button>
            <button
              onClick={() => setBillingCycle('YEARLY')}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition",
                billingCycle === 'YEARLY' 
                  ? 'bg-slate-900 text-white' 
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Jährlich
              <Badge className="ml-2 bg-green-500 text-white text-xs">2 Monate gratis</Badge>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tiers.map(tier => {
            const price = billingCycle === 'YEARLY' && tier.price_yearly 
              ? tier.price_yearly / 12 / 100 
              : tier.price_monthly / 100;
            
            const isPopular = tier.is_popular;

            return (
              <Card 
                key={tier.id}
                className={cn(
                  "relative overflow-hidden transition-all hover:shadow-xl",
                  isPopular && "border-2 border-emerald-500 shadow-lg scale-105"
                )}
              >
                {isPopular && (
                  <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-medium px-3 py-1 rounded-bl-lg">
                    {tier.badge_text || 'BELIEBT'}
                  </div>
                )}
                
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl font-light mb-2">{tier.name}</CardTitle>
                  <div className="space-y-1">
                    <div className="text-4xl font-light text-slate-900">
                      {price === 0 ? 'Kostenlos' : `${price.toFixed(2)}€`}
                    </div>
                    {price > 0 && (
                      <div className="text-sm text-slate-500">
                        pro Monat
                        {billingCycle === 'YEARLY' && (
                          <div className="text-xs text-green-600 mt-1">
                            Jährlich: {(tier.price_yearly / 100).toFixed(2)}€
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {tier.description && (
                    <p className="text-sm text-slate-600 mt-4">{tier.description}</p>
                  )}
                </CardHeader>

                <CardContent className="space-y-4 pb-8">
                  {groups.map(group => {
                    const groupFeatures = relevantFeatures.filter(f => f.group_id === group.id);
                    const hasAnyFeature = groupFeatures.some(f => {
                      const tf = getFeatureInTier(tier.id, f.id);
                      return tf && tf.inclusion_type !== 'EXCLUDED';
                    });

                    if (!hasAnyFeature) return null;

                    return (
                      <div key={group.id} className="space-y-2">
                        <div className="text-xs font-medium text-slate-500 uppercase">
                          {group.name}
                        </div>
                        {groupFeatures.map(feature => {
                          const tf = getFeatureInTier(tier.id, feature.id);
                          
                          if (!tf || tf.inclusion_type === 'EXCLUDED') {
                            return (
                              <div key={feature.id} className="flex items-start gap-2 text-sm text-slate-400">
                                <X className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <span>{feature.name}</span>
                              </div>
                            );
                          }

                          return (
                            <div key={feature.id} className="flex items-start gap-2 text-sm">
                              <Check className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600" />
                              <div className="flex-1">
                                <span className="text-slate-700">{feature.name}</span>
                                {tf.inclusion_type === 'AVAILABLE' && (
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    +{((tf.price_override || feature.standalone_price) / 100).toFixed(2)}€
                                  </Badge>
                                )}
                                {feature.is_quantifiable && tf.quantity_limit && (
                                  <span className="ml-2 text-xs text-slate-500">
                                    ({tf.quantity_limit === -1 ? 'unbegrenzt' : `${tf.quantity_limit} ${feature.quantity_unit}`})
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </CardContent>

                <CardFooter>
                  <Button 
                    className="w-full"
                    variant={isPopular ? 'default' : 'outline'}
                    onClick={() => handleSelectPlan(tier)}
                  >
                    {tier.trial_days > 0 ? `${tier.trial_days} Tage kostenlos testen` : 'Plan wählen'}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto pt-12">
          <h2 className="text-2xl font-light text-slate-900 text-center mb-8">
            Häufige Fragen
          </h2>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Kann ich jederzeit upgraden?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  Ja, du kannst jederzeit zu einem höheren Plan wechseln. Die Abrechnung erfolgt anteilig.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Was passiert nach der Trial-Phase?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  Nach dem kostenlosen Testzeitraum wird deine Zahlungsmethode belastet, sofern du nicht kündigst.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}