import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Star, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function AdminPricingProductFeatures() {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState(new Set());
  const [coreFeatures, setCoreFeatures] = useState(new Set());

  // Fetch product
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });
  const product = products.find(p => p.id === productId);

  // Fetch all feature groups
  const { data: featureGroups = [] } = useQuery({
    queryKey: ['featureGroups'],
    queryFn: () => base44.entities.FeatureGroup.list('sort_order', 100),
  });

  // Fetch all features
  const { data: features = [] } = useQuery({
    queryKey: ['features'],
    queryFn: () => base44.entities.Feature.list('sort_order', 500),
  });

  // Fetch existing product-feature assignments
  const { data: productFeatures = [] } = useQuery({
    queryKey: ['productFeatures', productId],
    queryFn: () => base44.entities.ProductFeature.filter({ product_id: productId }),
    enabled: !!productId,
  });

  // Initialize selected and core features
  React.useEffect(() => {
    if (productFeatures.length > 0) {
      const selected = new Set(productFeatures.map(pf => pf.data.feature_id));
      const core = new Set(
        productFeatures
          .filter(pf => pf.data.is_core_feature)
          .map(pf => pf.data.feature_id)
      );
      setSelectedFeatures(selected);
      setCoreFeatures(core);
    }
  }, [productFeatures]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      // Delete all existing assignments
      for (const pf of productFeatures) {
        await base44.entities.ProductFeature.delete(pf.id);
      }

      // Create new assignments
      const assignments = Array.from(selectedFeatures).map((featureId, index) => ({
        product_id: productId,
        feature_id: featureId,
        is_core_feature: coreFeatures.has(featureId),
        sort_order: index + 1
      }));

      if (assignments.length > 0) {
        await base44.entities.ProductFeature.bulkCreate(assignments);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productFeatures'] });
      toast.success('Features erfolgreich zugewiesen');
    },
    onError: (error) => {
      toast.error('Fehler beim Speichern: ' + error.message);
    }
  });

  // Group features by group_id
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

  // Filter features by search
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

  const toggleFeature = (featureId) => {
    const newSelected = new Set(selectedFeatures);
    if (newSelected.has(featureId)) {
      newSelected.delete(featureId);
      // Remove from core as well
      const newCore = new Set(coreFeatures);
      newCore.delete(featureId);
      setCoreFeatures(newCore);
    } else {
      newSelected.add(featureId);
    }
    setSelectedFeatures(newSelected);
  };

  const toggleCore = (featureId) => {
    const newCore = new Set(coreFeatures);
    if (newCore.has(featureId)) {
      newCore.delete(featureId);
    } else {
      newCore.add(featureId);
    }
    setCoreFeatures(newCore);
  };

  const formatPrice = (cents) => {
    if (!cents) return '-';
    return `${(cents / 100).toFixed(2)}€`;
  };

  if (!product) {
    return (
      <div className="p-8">
        <p className="text-slate-600">Produkt nicht gefunden.</p>
        <Link to={createPageUrl('AdminPricingProducts')}>
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zur Produktliste
          </Button>
        </Link>
      </div>
    );
  }

  const assignedCount = selectedFeatures.size;
  const coreCount = coreFeatures.size;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to={createPageUrl('AdminPricingProducts')}>
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück
            </Button>
          </Link>
          <h1 className="text-3xl font-light text-slate-900">
            Features für "{product.data.name}"
          </h1>
          <p className="text-slate-600 mt-1">
            Verfügbare Features dem Produkt zuweisen. Markiere Features als "Kern-Feature" um sie immer anzuzeigen.
          </p>
        </div>
        <Button 
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Save className="w-4 h-4 mr-2" />
          Änderungen speichern
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

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-normal text-slate-600">Zugewiesene Features</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-light">{assignedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-normal text-slate-600">Davon Kern-Features</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-light">{coreCount}</p>
          </CardContent>
        </Card>
      </div>

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
                    {groupFeatures.length} Features
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4">
                <div className="space-y-2">
                  {groupFeatures.map(feature => {
                    const isSelected = selectedFeatures.has(feature.id);
                    const isCore = coreFeatures.has(feature.id);

                    return (
                      <div
                        key={feature.id}
                        className="flex items-center gap-4 p-3 rounded-lg border bg-slate-50 hover:bg-slate-100 transition-colors"
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleFeature(feature.id)}
                        />
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-slate-500">
                              {feature.data.feature_code}
                            </span>
                            <span className="text-slate-900">{feature.data.name}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {feature.data.price_type}
                            </Badge>
                            {feature.data.standalone_price && (
                              <Badge className="text-xs bg-emerald-100 text-emerald-800">
                                {formatPrice(feature.data.standalone_price)}
                              </Badge>
                            )}
                            {feature.data.is_quantifiable && (
                              <Badge variant="outline" className="text-xs">
                                {feature.data.quantity_unit}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {isSelected && (
                          <Button
                            variant={isCore ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleCore(feature.id)}
                            className={isCore ? "bg-amber-500 hover:bg-amber-600" : ""}
                          >
                            <Star className={`w-4 h-4 mr-1 ${isCore ? 'fill-current' : ''}`} />
                            {isCore ? 'Kern' : 'Kern?'}
                          </Button>
                        )}
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
          Keine Features gefunden.
        </div>
      )}
    </div>
  );
}