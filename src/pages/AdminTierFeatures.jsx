import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, Save, Check, X, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminTierFeatures() {
  const urlParams = new URLSearchParams(window.location.search);
  const tierId = urlParams.get('tier');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [featureSettings, setFeatureSettings] = useState({});
  const queryClient = useQueryClient();

  const { data: tier } = useQuery({
    queryKey: ['tier', tierId],
    queryFn: async () => {
      const tiers = await base44.entities.PricingTier.filter({ id: tierId });
      return tiers[0];
    },
    enabled: !!tierId
  });

  const { data: product } = useQuery({
    queryKey: ['product', tier?.product_id],
    queryFn: async () => {
      const products = await base44.entities.Product.filter({ id: tier.product_id });
      return products[0];
    },
    enabled: !!tier?.product_id
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['featureGroups'],
    queryFn: () => base44.entities.FeatureGroup.list('-sort_order')
  });

  const { data: allFeatures = [] } = useQuery({
    queryKey: ['allFeatures'],
    queryFn: () => base44.entities.Feature.list('-sort_order')
  });

  const { data: productFeatures = [] } = useQuery({
    queryKey: ['productFeatures', tier?.product_id],
    queryFn: () => base44.entities.ProductFeature.filter({ product_id: tier.product_id }),
    enabled: !!tier?.product_id
  });

  const { data: tierFeatures = [] } = useQuery({
    queryKey: ['tierFeatures', tierId],
    queryFn: () => base44.entities.TierFeature.filter({ tier_id: tierId }),
    enabled: !!tierId
  });

  useEffect(() => {
    const settings = {};
    tierFeatures.forEach(tf => {
      settings[tf.feature_id] = {
        inclusion_type: tf.inclusion_type,
        quantity_limit: tf.quantity_limit,
        price_override: tf.price_override,
        is_highlighted: tf.is_highlighted
      };
    });
    setFeatureSettings(settings);
  }, [tierFeatures]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Lösche bestehende TierFeatures
      for (const tf of tierFeatures) {
        await base44.entities.TierFeature.delete(tf.id);
      }

      // Erstelle neue TierFeatures
      const toCreate = Object.entries(featureSettings)
        .filter(([_, settings]) => settings.inclusion_type !== 'EXCLUDED')
        .map(([featureId, settings], index) => ({
          tier_id: tierId,
          feature_id: featureId,
          inclusion_type: settings.inclusion_type,
          quantity_limit: settings.quantity_limit || null,
          price_override: settings.price_override || null,
          is_highlighted: settings.is_highlighted || false,
          sort_order: index
        }));

      if (toCreate.length > 0) {
        await base44.entities.TierFeature.bulkCreate(toCreate);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tierFeatures'] });
      toast.success('Features gespeichert');
    }
  });

  const updateFeature = (featureId, updates) => {
    setFeatureSettings(prev => ({
      ...prev,
      [featureId]: {
        ...(prev[featureId] || { inclusion_type: 'EXCLUDED' }),
        ...updates
      }
    }));
  };

  if (!tier || !product) {
    return <div className="p-6">Tarif nicht gefunden</div>;
  }

  // Nur Features anzeigen die zum Produkt gehören
  const productFeatureIds = new Set(productFeatures.map(pf => pf.feature_id));
  const availableFeatures = allFeatures.filter(f => productFeatureIds.has(f.id));

  const filteredFeatures = availableFeatures.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.feature_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const includedCount = Object.values(featureSettings).filter(s => s.inclusion_type === 'INCLUDED').length;
  const availableCount = Object.values(featureSettings).filter(s => s.inclusion_type === 'AVAILABLE').length;

  const inclusionColors = {
    INCLUDED: 'bg-green-100 text-green-700',
    AVAILABLE: 'bg-blue-100 text-blue-700',
    EXCLUDED: 'bg-slate-100 text-slate-500'
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to={createPageUrl('AdminPricingTiers')}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-light text-slate-900">
              Features für "{tier.name}"
            </h1>
            <p className="text-sm text-slate-600">
              Produkt: {product.name} • 
              Inkludiert: {includedCount} • 
              Hinzubuchbar: {availableCount}
            </p>
          </div>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {saveMutation.isPending ? 'Speichere...' : 'Änderungen speichern'}
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Input 
            placeholder="🔍 Features suchen..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </CardContent>
      </Card>

      <Accordion type="multiple" className="space-y-4" defaultValue={groups.map(g => g.id)}>
        {groups.map(group => {
          const groupFeatures = filteredFeatures.filter(f => f.group_id === group.id);
          if (groupFeatures.length === 0) return null;
          
          return (
            <AccordionItem key={group.id} value={group.id} className="border rounded-lg">
              <AccordionTrigger className="px-6 hover:no-underline">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{group.name}</span>
                  <Badge variant="secondary">{groupFeatures.length} Features</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="px-6 pb-4 space-y-2">
                  {groupFeatures.map(feature => {
                    const settings = featureSettings[feature.id] || { inclusion_type: 'EXCLUDED' };
                    
                    return (
                      <div 
                        key={feature.id} 
                        className="p-4 border rounded-lg hover:bg-slate-50"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                                {feature.feature_code}
                              </code>
                              <span className="text-sm font-medium">{feature.name}</span>
                            </div>
                            {feature.description && (
                              <p className="text-xs text-slate-500 mb-3">{feature.description}</p>
                            )}
                            
                            <div className="flex items-center gap-3 flex-wrap">
                              <Select 
                                value={settings.inclusion_type} 
                                onValueChange={v => updateFeature(feature.id, { inclusion_type: v })}
                              >
                                <SelectTrigger className="w-40">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="INCLUDED">✓ Inkludiert</SelectItem>
                                  <SelectItem value="AVAILABLE">+ Hinzubuchbar</SelectItem>
                                  <SelectItem value="EXCLUDED">✗ Ausgeschlossen</SelectItem>
                                </SelectContent>
                              </Select>

                              {feature.is_quantifiable && settings.inclusion_type === 'INCLUDED' && (
                                <div className="flex items-center gap-2">
                                  <Label className="text-xs">Limit:</Label>
                                  <Input 
                                    type="number"
                                    className="w-24"
                                    value={settings.quantity_limit || ''} 
                                    onChange={e => updateFeature(feature.id, { 
                                      quantity_limit: e.target.value ? Number(e.target.value) : null 
                                    })}
                                    placeholder="-1 = ∞"
                                  />
                                  <span className="text-xs text-slate-500">{feature.quantity_unit}</span>
                                </div>
                              )}

                              {settings.inclusion_type === 'AVAILABLE' && feature.standalone_price && (
                                <div className="flex items-center gap-2">
                                  <Label className="text-xs">Preis:</Label>
                                  <Input 
                                    type="number"
                                    className="w-32"
                                    value={settings.price_override || feature.standalone_price} 
                                    onChange={e => updateFeature(feature.id, { 
                                      price_override: Number(e.target.value) 
                                    })}
                                  />
                                  <span className="text-xs text-slate-500">Cent</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <Badge className={inclusionColors[settings.inclusion_type]}>
                            {settings.inclusion_type === 'INCLUDED' ? '✓' : 
                             settings.inclusion_type === 'AVAILABLE' ? '+' : '✗'}
                          </Badge>
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
    </div>
  );
}