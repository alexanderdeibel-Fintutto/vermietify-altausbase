import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, X, Plus, Zap } from 'lucide-react';

export default function AdminPricingMatrix() {
  const [selectedProduct, setSelectedProduct] = useState('');

  const { data: products = [] } = useQuery({
    queryKey: ['adminProducts'],
    queryFn: () => base44.entities.Product.list('-sort_order')
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['featureGroups'],
    queryFn: () => base44.entities.FeatureGroup.list('-sort_order')
  });

  const { data: allFeatures = [] } = useQuery({
    queryKey: ['allFeatures'],
    queryFn: () => base44.entities.Feature.list('-sort_order')
  });

  const { data: tiers = [] } = useQuery({
    queryKey: ['pricingTiers'],
    queryFn: () => base44.entities.PricingTier.list('-tier_level'),
    enabled: !!selectedProduct
  });

  const { data: tierFeatures = [] } = useQuery({
    queryKey: ['allTierFeatures'],
    queryFn: () => base44.entities.TierFeature.list()
  });

  const { data: productFeatures = [] } = useQuery({
    queryKey: ['productFeatures', selectedProduct],
    queryFn: () => base44.entities.ProductFeature.filter({ product_id: selectedProduct }),
    enabled: !!selectedProduct
  });

  const product = products.find(p => p.id === selectedProduct);
  const productTiers = tiers.filter(t => t.product_id === selectedProduct);
  
  const productFeatureIds = new Set(productFeatures.map(pf => pf.feature_id));
  const availableFeatures = allFeatures.filter(f => productFeatureIds.has(f.id));

  const getFeatureInTier = (tierId, featureId) => {
    return tierFeatures.find(tf => tf.tier_id === tierId && tf.feature_id === featureId);
  };

  const renderCell = (tier, feature) => {
    const tf = getFeatureInTier(tier.id, feature.id);
    
    if (!tf || tf.inclusion_type === 'EXCLUDED') {
      return (
        <div className="flex items-center justify-center h-full">
          <X className="h-4 w-4 text-slate-300" />
        </div>
      );
    }

    if (tf.inclusion_type === 'INCLUDED') {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <Check className="h-5 w-5 text-green-600 mb-1" />
          {feature.is_quantifiable && tf.quantity_limit && (
            <span className="text-xs text-slate-600">
              {tf.quantity_limit === -1 ? '∞' : tf.quantity_limit} {feature.quantity_unit}
            </span>
          )}
        </div>
      );
    }

    if (tf.inclusion_type === 'AVAILABLE') {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <Plus className="h-4 w-4 text-blue-600 mb-1" />
          {tf.price_override && (
            <span className="text-xs text-slate-600">
              +{(tf.price_override / 100).toFixed(2)}€
            </span>
          )}
        </div>
      );
    }
  };

  if (!selectedProduct) {
    return (
      <div className="max-w-7xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Pricing-Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">Wähle ein Produkt aus:</p>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Produkt auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {products.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light text-slate-900">Pricing-Matrix</h1>
          <p className="text-sm text-slate-600">
            Feature-Vergleich: {product?.name}
          </p>
        </div>
        <Select value={selectedProduct} onValueChange={setSelectedProduct}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {products.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {productTiers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-500">Noch keine Tarife für dieses Produkt definiert.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-sm">
            <thead>
              <tr className="bg-slate-50 border-b">
                <th className="text-left p-4 font-medium text-slate-900 sticky left-0 bg-slate-50 z-10 min-w-[240px]">
                  Feature
                </th>
                {productTiers.map(tier => (
                  <th key={tier.id} className="p-4 text-center min-w-[180px]">
                    <div className="space-y-1">
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-medium text-slate-900">{tier.name}</span>
                        {tier.is_popular && <Badge className="bg-yellow-500 text-slate-900 text-xs">⭐</Badge>}
                      </div>
                      <div className="text-lg font-bold text-slate-900">
                        {tier.price_monthly === 0 ? 'Kostenlos' : `${(tier.price_monthly / 100).toFixed(2)}€`}
                      </div>
                      {tier.price_monthly > 0 && (
                        <div className="text-xs text-slate-500">/Monat</div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map(group => {
                const groupFeatures = availableFeatures.filter(f => f.group_id === group.id);
                if (groupFeatures.length === 0) return null;

                return (
                  <React.Fragment key={group.id}>
                    <tr className="bg-slate-100">
                      <td colSpan={productTiers.length + 1} className="p-3 font-medium text-sm text-slate-700 sticky left-0 bg-slate-100 z-10">
                        {group.name}
                      </td>
                    </tr>
                    {groupFeatures.map(feature => (
                      <tr key={feature.id} className="border-b hover:bg-slate-50">
                        <td className="p-4 sticky left-0 bg-white z-10">
                          <div>
                            <div className="font-medium text-sm">{feature.name}</div>
                            {feature.description && (
                              <div className="text-xs text-slate-500 mt-1">{feature.description}</div>
                            )}
                          </div>
                        </td>
                        {productTiers.map(tier => (
                          <td key={tier.id} className="p-4 border-l">
                            {renderCell(tier, feature)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Card className="bg-slate-50">
        <CardContent className="py-4">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-slate-600">Inkludiert</span>
            </div>
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-blue-600" />
              <span className="text-slate-600">Hinzubuchbar</span>
            </div>
            <div className="flex items-center gap-2">
              <X className="h-4 w-4 text-slate-300" />
              <span className="text-slate-600">Nicht verfügbar</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}