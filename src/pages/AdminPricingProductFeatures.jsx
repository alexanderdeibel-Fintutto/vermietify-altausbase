import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, Star } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AdminPricingProductFeatures() {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('product_id');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState({});
  const [coreFeatures, setCoreFeatures] = useState({});
  const queryClient = useQueryClient();

  const { data: product } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const products = await base44.entities.Product.filter({ id: productId });
      return products[0];
    },
    enabled: !!productId
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['featureGroups'],
    queryFn: () => base44.entities.FeatureGroup.list('sort_order')
  });

  const { data: features = [] } = useQuery({
    queryKey: ['features'],
    queryFn: () => base44.entities.Feature.list('sort_order')
  });

  const { data: productFeatures = [] } = useQuery({
    queryKey: ['productFeatures', productId],
    queryFn: () => base44.entities.ProductFeature.filter({ product_id: productId }),
    enabled: !!productId
  });

  useEffect(() => {
    const selected = {};
    const core = {};
    productFeatures.forEach(pf => {
      selected[pf.feature_id] = true;
      core[pf.feature_id] = pf.is_core_feature;
    });
    setSelectedFeatures(selected);
    setCoreFeatures(core);
  }, [productFeatures]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Delete all existing
      for (const pf of productFeatures) {
        await base44.entities.ProductFeature.delete(pf.id);
      }

      // Create new ones
      let sortOrder = 1;
      for (const featureId of Object.keys(selectedFeatures)) {
        if (selectedFeatures[featureId]) {
          await base44.entities.ProductFeature.create({
            product_id: productId,
            feature_id: featureId,
            is_core_feature: coreFeatures[featureId] || false,
            sort_order: sortOrder++
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['productFeatures']);
      toast.success('Änderungen gespeichert');
    }
  });

  const toggleFeature = (featureId) => {
    setSelectedFeatures(prev => ({
      ...prev,
      [featureId]: !prev[featureId]
    }));
  };

  const toggleCore = (featureId) => {
    setCoreFeatures(prev => ({
      ...prev,
      [featureId]: !prev[featureId]
    }));
  };

  const groupedFeatures = groups.map(group => ({
    ...group,
    features: features.filter(f => 
      f.group_id === group.id && 
      (searchTerm === '' || 
       f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       f.feature_code.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  })).filter(g => g.features.length > 0);

  const selectedCount = Object.values(selectedFeatures).filter(Boolean).length;
  const coreCount = Object.entries(selectedFeatures)
    .filter(([id, selected]) => selected && coreFeatures[id])
    .length;

  if (!product) return <div className="p-8">Produkt nicht gefunden</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <Link to={createPageUrl('AdminPricingProducts')}>
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Features für "{product.name}"</h1>
            <p className="text-slate-500 mt-1">
              Verfügbare Features dem Produkt zuweisen. Markiere Features als "Kern-Feature" um sie immer anzuzeigen.
            </p>
          </div>
          <Button onClick={() => saveMutation.mutate()}>
            Änderungen speichern
          </Button>
        </div>
      </div>

      <Card className="p-4 mb-6">
        <Input
          placeholder="🔍 Features suchen..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </Card>

      <Accordion type="multiple" defaultValue={groups.map(g => g.id)} className="space-y-4">
        {groupedFeatures.map(group => (
          <AccordionItem key={group.id} value={group.id} asChild>
            <Card>
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{group.icon}</span>
                  <div className="text-left">
                    <div className="font-semibold">{group.name}</div>
                    <div className="text-sm text-slate-500">
                      {group.features.filter(f => selectedFeatures[f.id]).length} von {group.features.length} ausgewählt
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="px-6 pb-4 space-y-2">
                  {group.features.map(feature => (
                    <div 
                      key={feature.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Checkbox
                          checked={selectedFeatures[feature.id] || false}
                          onCheckedChange={() => toggleFeature(feature.id)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{feature.name}</span>
                            <code className="text-xs bg-slate-100 px-2 py-0.5 rounded">
                              {feature.feature_code}
                            </code>
                            <Badge variant="outline" className="text-xs">
                              {feature.price_type}
                            </Badge>
                          </div>
                          {feature.description && (
                            <p className="text-sm text-slate-500 mt-1">{feature.description}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant={coreFeatures[feature.id] ? "default" : "outline"}
                        size="sm"
                        disabled={!selectedFeatures[feature.id]}
                        onClick={() => toggleCore(feature.id)}
                      >
                        <Star className={`w-4 h-4 mr-1 ${coreFeatures[feature.id] ? 'fill-current' : ''}`} />
                        Kern
                      </Button>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </Card>
          </AccordionItem>
        ))}
      </Accordion>

      <Card className="p-6 mt-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm text-slate-500">Zugewiesene Features</div>
            <div className="text-2xl font-bold">{selectedCount} von {features.length}</div>
            <div className="text-sm text-slate-500 mt-1">
              Davon Kern-Features: {coreCount}
            </div>
          </div>
          <Button onClick={() => saveMutation.mutate()}>
            Änderungen speichern
          </Button>
        </div>
      </Card>
    </div>
  );
}