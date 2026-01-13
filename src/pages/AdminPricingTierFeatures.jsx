import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function AdminPricingTierFeatures() {
  const urlParams = new URLSearchParams(window.location.search);
  const tierId = urlParams.get('id');
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [assignments, setAssignments] = useState({}); // { featureId: { inclusion_type, quantity_limit, highlighted } }

  // Fetch tier
  const { data: tiers = [] } = useQuery({
    queryKey: ['pricingTiers'],
    queryFn: () => base44.entities.PricingTier.list(),
  });
  const tier = tiers.find(t => t.id === tierId);

  // Fetch product
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });
  const product = tier ? products.find(p => p.id === tier.data.product_id) : null;

  // Fetch all feature groups
  const { data: featureGroups = [] } = useQuery({
    queryKey: ['featureGroups'],
    queryFn: () => base44.entities.FeatureGroup.list('sort_order', 100),
  });

  // Fetch product features (only features assigned to this product)
  const { data: productFeatures = [] } = useQuery({
    queryKey: ['productFeatures', product?.id],
    queryFn: () => base44.entities.ProductFeature.filter({ product_id: product?.id }),
    enabled: !!product,
  });

  // Fetch all features
  const { data: allFeatures = [] } = useQuery({
    queryKey: ['features'],
    queryFn: () => base44.entities.Feature.list('sort_order', 500),
  });

  // Fetch existing tier-feature assignments
  const { data: tierFeatures = [] } = useQuery({
    queryKey: ['tierFeatures', tierId],
    queryFn: () => base44.entities.TierFeature.filter({ tier_id: tierId }),
    enabled: !!tierId,
  });

  // Initialize assignments from existing data
  React.useEffect(() => {
    if (tierFeatures.length > 0) {
      const newAssignments = {};
      tierFeatures.forEach(tf => {
        newAssignments[tf.data.feature_id] = {
          inclusion_type: tf.data.inclusion_type,
          quantity_limit: tf.data.quantity_limit,
          is_highlighted: tf.data.is_highlighted,
          price_override: tf.data.price_override,
          sort_order: tf.data.sort_order
        };
      });
      setAssignments(newAssignments);
    }
  }, [tierFeatures]);

  // Get only features that belong to this product
  const productFeatureIds = useMemo(() => {
    return new Set(productFeatures.map(pf => pf.data.feature_id));
  }, [productFeatures]);

  const availableFeatures = useMemo(() => {
    return allFeatures.filter(f => productFeatureIds.has(f.id));
  }, [allFeatures, productFeatureIds]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      // Delete all existing assignments
      for (const tf of tierFeatures) {
        await base44.entities.TierFeature.delete(tf.id);
      }

      // Create new assignments
      const newAssignments = Object.entries(assignments)
        .filter(([_, data]) => data.inclusion_type !== 'EXCLUDED')
        .map(([featureId, data], index) => ({
          tier_id: tierId,
          feature_id: featureId,
          inclusion_type: data.inclusion_type,
          quantity_limit: data.quantity_limit || null,
          price_override: data.price_override || null,
          is_highlighted: data.is_highlighted || false,
          sort_order: data.sort_order || index + 1
        }));

      if (newAssignments.length > 0) {
        await base44.entities.TierFeature.bulkCreate(newAssignments);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tierFeatures'] });
      toast.success('Feature-Zuweisung gespeichert');
    },
    onError: (error) => {
      toast.error('Fehler: ' + error.message);
    }
  });

  // Group features by group_id
  const groupedFeatures = useMemo(() => {
    const grouped = {};
    availableFeatures.forEach(feature => {
      const groupId = feature.data.group_id;
      if (!grouped[groupId]) {
        grouped[groupId] = [];
      }
      grouped[groupId].push(feature);
    });
    return grouped;
  }, [availableFeatures]);

  // Filter by search
  const filteredGroups = useMemo(() => {
    if (!searchQuery) return groupedFeatures;

    const filtered = {};
    Object.entries(groupedFeatures).forEach(([groupId, groupFeatures]) => {
      const matches = groupFeatures.filter(f => 
        f.data.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.data.feature_code.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (matches.length > 0) {
        filtered[groupId] = matches;
      }
    });
    return filtered;
  }, [groupedFeatures, searchQuery]);

  const updateAssignment = (featureId, field, value) => {
    setAssignments(prev => ({
      ...prev,
      [featureId]: {
        ...(prev[featureId] || { inclusion_type: 'INCLUDED' }),
        [field]: value
      }
    }));
  };

  const formatPrice = (cents) => {
    if (!cents) return '-';
    return `${(cents / 100).toFixed(2)}€`;
  };

  if (!tier || !product) {
    return (
      <div className="p-8">
        <p className="text-slate-600">Tarif nicht gefunden.</p>
        <Link to={createPageUrl('AdminPricingTiersV2')}>
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to={createPageUrl('AdminPricingTiersV2')}>
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück
            </Button>
          </Link>
          <h1 className="text-3xl font-light text-slate-900">
            Features für "{tier.data.name}"
          </h1>
          <p className="text-slate-600 mt-1">
            Produkt: {product.data.name} • Level {tier.data.tier_level}
          </p>
        </div>
        <Button 
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Save className="w-4 h-4 mr-2" />
          Speichern
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Features suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Info */}
      <Card className="mb-6 bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="text-sm text-slate-700">
            <strong>Hinweis:</strong> INCLUDED = Im Tarif enthalten • AVAILABLE = Zubuchbar • EXCLUDED = Nicht verfügbar
          </div>
        </CardContent>
      </Card>

      {/* Feature Groups Accordion */}
      <Accordion type="multiple" defaultValue={Object.keys(filteredGroups)} className="space-y-4">
        {featureGroups.map(group => {
          const groupFeatures = filteredGroups[group.id] || [];
          if (groupFeatures.length === 0) return null;

          return (
            <AccordionItem key={group.id} value={group.id} className="border rounded-lg bg-white">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-light">{group.data.name}</span>
                  <Badge variant="outline" className="bg-slate-100">
                    {groupFeatures.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4">
                <div className="space-y-3">
                  {groupFeatures.map(feature => {
                    const assignment = assignments[feature.id] || { inclusion_type: 'EXCLUDED' };

                    return (
                      <div
                        key={feature.id}
                        className="p-4 rounded-lg border bg-slate-50"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <code className="text-xs bg-slate-200 px-2 py-1 rounded">
                                {feature.data.feature_code}
                              </code>
                              <span className="font-medium">{feature.data.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {feature.data.price_type}
                              </Badge>
                              {feature.data.standalone_price && (
                                <span className="text-xs text-slate-500">
                                  {formatPrice(feature.data.standalone_price)}
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                              {/* Inclusion Type */}
                              <div>
                                <label className="text-xs text-slate-600 block mb-1">Verfügbarkeit</label>
                                <Select
                                  value={assignment.inclusion_type}
                                  onValueChange={(value) => updateAssignment(feature.id, 'inclusion_type', value)}
                                >
                                  <SelectTrigger className="h-9">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="INCLUDED">
                                      <span className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                        Inkludiert
                                      </span>
                                    </SelectItem>
                                    <SelectItem value="AVAILABLE">
                                      <span className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                        Zubuchbar
                                      </span>
                                    </SelectItem>
                                    <SelectItem value="EXCLUDED">
                                      <span className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                                        Ausgeschlossen
                                      </span>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Quantity Limit */}
                              {feature.data.is_quantifiable && assignment.inclusion_type === 'INCLUDED' && (
                                <div>
                                  <label className="text-xs text-slate-600 block mb-1">
                                    Limit ({feature.data.quantity_unit})
                                  </label>
                                  <Input
                                    type="number"
                                    min="-1"
                                    placeholder="-1 = ∞"
                                    value={assignment.quantity_limit ?? ''}
                                    onChange={(e) => updateAssignment(feature.id, 'quantity_limit', e.target.value ? parseInt(e.target.value) : null)}
                                    className="h-9"
                                  />
                                </div>
                              )}

                              {/* Price Override */}
                              {assignment.inclusion_type === 'AVAILABLE' && (
                                <div>
                                  <label className="text-xs text-slate-600 block mb-1">
                                    Preis (EUR, optional)
                                  </label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="Überschreiben"
                                    value={assignment.price_override ? assignment.price_override / 100 : ''}
                                    onChange={(e) => updateAssignment(
                                      feature.id, 
                                      'price_override', 
                                      e.target.value ? Math.round(parseFloat(e.target.value) * 100) : null
                                    )}
                                    className="h-9"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {Object.keys(filteredGroups).length === 0 && (
        <div className="text-center py-12 text-slate-500">
          Keine Features gefunden. Weise erst Features dem Produkt "{product?.data.name}" zu.
        </div>
      )}
    </div>
  );
}