import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Download, Grid3x3, List, Eye, CheckCircle2, XCircle, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export default function AdminPricingMatrix() {
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [viewMode, setViewMode] = useState('features'); // 'features' or 'limits'

  // Fetch all data
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list('sort_order', 100),
  });

  const { data: tiers = [] } = useQuery({
    queryKey: ['pricingTiers'],
    queryFn: () => base44.entities.PricingTier.list('sort_order', 200),
  });

  const { data: features = [] } = useQuery({
    queryKey: ['features'],
    queryFn: () => base44.entities.Feature.list('sort_order', 500),
  });

  const { data: featureGroups = [] } = useQuery({
    queryKey: ['featureGroups'],
    queryFn: () => base44.entities.FeatureGroup.list('sort_order', 100),
  });

  const { data: tierFeatures = [] } = useQuery({
    queryKey: ['tierFeatures'],
    queryFn: () => base44.entities.TierFeature.list('-created_date', 1000),
  });

  const { data: usageLimits = [] } = useQuery({
    queryKey: ['usageLimits'],
    queryFn: () => base44.entities.UsageLimit.list('sort_order', 100),
  });

  const { data: tierLimits = [] } = useQuery({
    queryKey: ['tierLimits'],
    queryFn: () => base44.entities.TierLimit.list('-created_date', 500),
  });

  const { data: productFeatures = [] } = useQuery({
    queryKey: ['productFeatures'],
    queryFn: () => base44.entities.ProductFeature.list('-created_date', 1000),
  });

  // Filter tiers by product
  const filteredTiers = useMemo(() => {
    if (selectedProduct === 'all') return tiers;
    return tiers.filter(t => t.data.product_id === selectedProduct);
  }, [tiers, selectedProduct]);

  // Get features for a specific tier
  const getTierFeature = (tierId, featureId) => {
    return tierFeatures.find(tf => 
      tf.data.tier_id === tierId && tf.data.feature_id === featureId
    );
  };

  // Get limit for a specific tier
  const getTierLimit = (tierId, limitId) => {
    return tierLimits.find(tl => 
      tl.data.tier_id === tierId && tl.data.limit_id === limitId
    );
  };

  // Get product features
  const getProductFeatureIds = (productId) => {
    return new Set(
      productFeatures
        .filter(pf => pf.data.product_id === productId)
        .map(pf => pf.data.feature_id)
    );
  };

  // Group features by group
  const groupedFeatures = useMemo(() => {
    const grouped = {};
    features.forEach(feature => {
      const groupId = feature.data.group_id;
      if (!grouped[groupId]) {
        grouped[groupId] = [];
      }
      grouped[groupId].push(feature);
    });
    return grouped;
  }, [features]);

  const formatPrice = (cents) => {
    if (!cents) return '0€';
    return `${(cents / 100).toFixed(0)}€`;
  };

  const formatLimit = (value) => {
    if (value === -1) return '∞';
    if (value === 0) return '✗';
    return value;
  };

  const renderFeatureCell = (tier, feature) => {
    const productFeatureIds = getProductFeatureIds(tier.data.product_id);
    if (!productFeatureIds.has(feature.id)) {
      return <div className="text-center text-slate-300">-</div>;
    }

    const tierFeature = getTierFeature(tier.id, feature.id);
    
    if (!tierFeature) {
      return <div className="text-center text-slate-400">✗</div>;
    }

    const inclusionType = tierFeature.data.inclusion_type;
    
    if (inclusionType === 'INCLUDED') {
      return (
        <div className="text-center">
          <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />
          {feature.data.is_quantifiable && tierFeature.data.quantity_limit && (
            <span className="text-xs text-slate-600 block mt-1">
              {formatLimit(tierFeature.data.quantity_limit)}
            </span>
          )}
        </div>
      );
    }

    if (inclusionType === 'AVAILABLE') {
      return (
        <div className="text-center">
          <DollarSign className="w-5 h-5 text-blue-600 mx-auto" />
          {tierFeature.data.price_override && (
            <span className="text-xs text-slate-600 block mt-1">
              {formatPrice(tierFeature.data.price_override)}
            </span>
          )}
        </div>
      );
    }

    return <div className="text-center text-slate-400">✗</div>;
  };

  const renderLimitCell = (tier, limit) => {
    const tierLimit = getTierLimit(tier.id, limit.id);
    
    if (!tierLimit) {
      return <div className="text-center text-slate-400">-</div>;
    }

    const value = tierLimit.data.limit_value;
    const formatted = formatLimit(value);

    return (
      <div className="text-center">
        <span className={cn(
          "font-mono text-sm",
          value === -1 && "text-green-600",
          value === 0 && "text-red-600",
          value > 0 && "text-slate-700"
        )}>
          {formatted}
        </span>
      </div>
    );
  };

  const exportToCSV = () => {
    // Simple CSV export functionality
    const headers = ['Product', 'Tier', 'Feature', 'Included'];
    const rows = [];

    filteredTiers.forEach(tier => {
      const product = products.find(p => p.id === tier.data.product_id);
      features.forEach(feature => {
        const productFeatureIds = getProductFeatureIds(tier.data.product_id);
        if (!productFeatureIds.has(feature.id)) return;

        const tierFeature = getTierFeature(tier.id, feature.id);
        rows.push([
          product?.data.name || '',
          tier.data.name,
          feature.data.name,
          tierFeature?.data.inclusion_type || 'EXCLUDED'
        ]);
      });
    });

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pricing-matrix.csv';
    a.click();
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-light text-slate-900">Pricing Matrix</h1>
          <p className="text-slate-600 mt-1">Vollständige Feature-/Limit-Übersicht</p>
        </div>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          CSV Export
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm text-slate-600 block mb-2">Produkt filtern</label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Produkte</SelectItem>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.data.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'features' ? 'default' : 'outline'}
                onClick={() => setViewMode('features')}
                size="sm"
              >
                <Grid3x3 className="w-4 h-4 mr-2" />
                Features
              </Button>
              <Button
                variant={viewMode === 'limits' ? 'default' : 'outline'}
                onClick={() => setViewMode('limits')}
                size="sm"
              >
                <List className="w-4 h-4 mr-2" />
                Limits
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="mb-6 bg-slate-50">
        <CardContent className="pt-6">
          <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span>Inkludiert</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-blue-600" />
              <span>Zubuchbar</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-slate-400" />
              <span>Nicht verfügbar</span>
            </div>
            {viewMode === 'limits' && (
              <>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-green-600">∞</span>
                  <span>Unbegrenzt</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-red-600">✗</span>
                  <span>Deaktiviert</span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Matrix */}
      {viewMode === 'features' ? (
        <div className="space-y-6">
          {featureGroups.map(group => {
            const groupFeatures = groupedFeatures[group.id] || [];
            if (groupFeatures.length === 0) return null;

            return (
              <Card key={group.id}>
                <CardHeader className="bg-slate-50">
                  <CardTitle className="font-light text-lg">{group.data.name}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-slate-50">
                          <th className="text-left py-3 px-4 font-normal text-slate-600 sticky left-0 bg-slate-50 z-10 min-w-[250px]">
                            Feature
                          </th>
                          {filteredTiers.map(tier => (
                            <th key={tier.id} className="text-center py-3 px-4 font-normal min-w-[120px]">
                              <div>
                                <div className="font-medium text-slate-900">{tier.data.name}</div>
                                <div className="text-xs text-slate-500 mt-1">
                                  {formatPrice(tier.data.price_monthly)}/mo
                                </div>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {groupFeatures.map(feature => (
                          <tr key={feature.id} className="border-b hover:bg-slate-50">
                            <td className="py-3 px-4 sticky left-0 bg-white z-10">
                              <div>
                                <div className="font-medium">{feature.data.name}</div>
                                <code className="text-xs text-slate-500">{feature.data.feature_code}</code>
                              </div>
                            </td>
                            {filteredTiers.map(tier => (
                              <td key={tier.id} className="py-3 px-4">
                                {renderFeatureCell(tier, feature)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardHeader className="bg-slate-50">
            <CardTitle className="font-light text-lg">Usage Limits</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="text-left py-3 px-4 font-normal text-slate-600 sticky left-0 bg-slate-50 z-10 min-w-[250px]">
                      Limit
                    </th>
                    {filteredTiers.map(tier => (
                      <th key={tier.id} className="text-center py-3 px-4 font-normal min-w-[120px]">
                        <div>
                          <div className="font-medium text-slate-900">{tier.data.name}</div>
                          <div className="text-xs text-slate-500 mt-1">
                            Level {tier.data.tier_level}
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {usageLimits.map(limit => (
                    <tr key={limit.id} className="border-b hover:bg-slate-50">
                      <td className="py-3 px-4 sticky left-0 bg-white z-10">
                        <div>
                          <div className="font-medium">{limit.data.name}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="text-xs text-slate-500">{limit.data.limit_code}</code>
                            <Badge variant="outline" className="text-xs">
                              {limit.data.limit_type}
                            </Badge>
                          </div>
                        </div>
                      </td>
                      {filteredTiers.map(tier => (
                        <td key={tier.id} className="py-3 px-4">
                          {renderLimitCell(tier, limit)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {filteredTiers.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          Keine Tarife vorhanden.
        </div>
      )}
    </div>
  );
}