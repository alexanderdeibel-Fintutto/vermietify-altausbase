import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, Save, Star } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminProductFeatures() {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('product');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [assignedFeatures, setAssignedFeatures] = useState(new Set());
  const [coreFeatures, setCoreFeatures] = useState(new Set());
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
    queryFn: () => base44.entities.FeatureGroup.list('-sort_order')
  });

  const { data: features = [] } = useQuery({
    queryKey: ['allFeatures'],
    queryFn: () => base44.entities.Feature.list('-sort_order')
  });

  const { data: productFeatures = [] } = useQuery({
    queryKey: ['productFeatures', productId],
    queryFn: () => base44.entities.ProductFeature.filter({ product_id: productId }),
    enabled: !!productId
  });

  useEffect(() => {
    const assigned = new Set(productFeatures.map(pf => pf.feature_id));
    const core = new Set(productFeatures.filter(pf => pf.is_core_feature).map(pf => pf.feature_id));
    setAssignedFeatures(assigned);
    setCoreFeatures(core);
  }, [productFeatures]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Lösche alle bestehenden Zuweisungen
      for (const pf of productFeatures) {
        await base44.entities.ProductFeature.delete(pf.id);
      }

      // Erstelle neue Zuweisungen
      const toCreate = Array.from(assignedFeatures).map((featureId, index) => ({
        product_id: productId,
        feature_id: featureId,
        is_core_feature: coreFeatures.has(featureId),
        sort_order: index
      }));

      if (toCreate.length > 0) {
        await base44.entities.ProductFeature.bulkCreate(toCreate);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productFeatures'] });
      toast.success('Features gespeichert');
    }
  });

  const toggleFeature = (featureId) => {
    const newAssigned = new Set(assignedFeatures);
    if (newAssigned.has(featureId)) {
      newAssigned.delete(featureId);
      const newCore = new Set(coreFeatures);
      newCore.delete(featureId);
      setCoreFeatures(newCore);
    } else {
      newAssigned.add(featureId);
    }
    setAssignedFeatures(newAssigned);
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

  if (!product) {
    return <div className="p-6">Produkt nicht gefunden</div>;
  }

  const filteredFeatures = features.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.feature_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to={createPageUrl('AdminPricingProducts')}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-light text-slate-900">
              Features für "{product.name}"
            </h1>
            <p className="text-sm text-slate-600">
              Zugewiesene Features: {assignedFeatures.size} • 
              Davon Kern-Features: {coreFeatures.size}
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
          
          return (
            <AccordionItem key={group.id} value={group.id} className="border rounded-lg">
              <AccordionTrigger className="px-6 hover:no-underline">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{group.name}</span>
                  <Badge variant="secondary">
                    {groupFeatures.filter(f => assignedFeatures.has(f.id)).length} / {groupFeatures.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="px-6 pb-4 space-y-2">
                  {groupFeatures.map(feature => (
                    <div 
                      key={feature.id} 
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Checkbox 
                          checked={assignedFeatures.has(feature.id)}
                          onCheckedChange={() => toggleFeature(feature.id)}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                              {feature.feature_code}
                            </code>
                            <span className="text-sm font-medium">{feature.name}</span>
                          </div>
                          {feature.description && (
                            <p className="text-xs text-slate-500 mt-1">{feature.description}</p>
                          )}
                        </div>
                      </div>
                      
                      {assignedFeatures.has(feature.id) && (
                        <Button
                          variant={coreFeatures.has(feature.id) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleCore(feature.id)}
                          className="gap-2"
                        >
                          <Star className={`h-3 w-3 ${coreFeatures.has(feature.id) ? 'fill-current' : ''}`} />
                          {coreFeatures.has(feature.id) ? 'Kern' : 'Optional'}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}