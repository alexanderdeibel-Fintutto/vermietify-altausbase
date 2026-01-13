import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Check, Package } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminPricingBundles() {
  const [editingBundle, setEditingBundle] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: bundles = [] } = useQuery({
    queryKey: ['productBundles'],
    queryFn: () => base44.entities.ProductBundle.list('-sort_order')
  });

  const { data: bundleProducts = [] } = useQuery({
    queryKey: ['bundleProducts'],
    queryFn: () => base44.entities.BundleProduct.list()
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ProductBundle.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productBundles'] });
      setDialogOpen(false);
      setEditingBundle(null);
      toast.success('Bundle erstellt');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProductBundle.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productBundles'] });
      setDialogOpen(false);
      setEditingBundle(null);
      toast.success('Bundle aktualisiert');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProductBundle.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productBundles'] });
      toast.success('Bundle gelöscht');
    }
  });

  const getBundleProducts = (bundleId) => {
    return bundleProducts
      .filter(bp => bp.bundle_id === bundleId)
      .map(bp => products.find(p => p.id === bp.product_id))
      .filter(Boolean);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light text-slate-900">Produkt-Bundles</h1>
          <p className="text-sm text-slate-600">Kombiniere mehrere Produkte zu attraktiven Paketen</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingBundle(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Neues Bundle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingBundle ? 'Bundle bearbeiten' : 'Neues Bundle'}</DialogTitle>
            </DialogHeader>
            <BundleForm 
              bundle={editingBundle}
              onSave={(data) => {
                if (editingBundle) {
                  updateMutation.mutate({ id: editingBundle.id, data });
                } else {
                  createMutation.mutate(data);
                }
              }}
              onCancel={() => {
                setDialogOpen(false);
                setEditingBundle(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {bundles.map(bundle => {
          const bundleProds = getBundleProducts(bundle.id);
          
          return (
            <Card key={bundle.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Package className="h-5 w-5" style={{ color: bundle.color }} />
                      <CardTitle className="text-lg">{bundle.name}</CardTitle>
                      <code className="text-xs bg-slate-100 px-2 py-1 rounded">{bundle.bundle_code}</code>
                      {!bundle.is_active && <Badge variant="outline">Inaktiv</Badge>}
                    </div>
                    {bundle.description && (
                      <p className="text-sm text-slate-600">{bundle.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        setEditingBundle(bundle);
                        setDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        if (confirm('Bundle wirklich löschen?')) {
                          deleteMutation.mutate(bundle.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-4 text-sm">
                    {bundle.discount_percent > 0 && (
                      <Badge className="bg-green-100 text-green-700">
                        {bundle.discount_percent}% Rabatt
                      </Badge>
                    )}
                    {bundle.bundle_price > 0 && (
                      <span className="font-medium">
                        Fixpreis: {(bundle.bundle_price / 100).toFixed(2)}€
                      </span>
                    )}
                  </div>
                  {bundleProds.length > 0 && (
                    <div>
                      <div className="text-xs text-slate-500 mb-2">Enthaltene Produkte:</div>
                      <div className="flex gap-2 flex-wrap">
                        {bundleProds.map(p => (
                          <Badge key={p.id} variant="outline" style={{ color: p.color }}>
                            {p.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function BundleForm({ bundle, onSave, onCancel }) {
  const [formData, setFormData] = useState(bundle || {
    bundle_code: '',
    name: '',
    description: '',
    discount_percent: 0,
    bundle_price: 0,
    is_active: true,
    icon: 'Package',
    color: '#10B981',
    sort_order: 0
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Code *</Label>
            <Input 
              value={formData.bundle_code} 
              onChange={e => setFormData({...formData, bundle_code: e.target.value.toUpperCase()})}
              placeholder="COMPLETE_SUITE"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="Komplettpaket"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Beschreibung</Label>
          <Textarea 
            value={formData.description} 
            onChange={e => setFormData({...formData, description: e.target.value})}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Rabatt (%)</Label>
            <Input 
              type="number"
              value={formData.discount_percent} 
              onChange={e => setFormData({...formData, discount_percent: Number(e.target.value)})}
              min="0"
              max="100"
            />
          </div>
          <div className="space-y-2">
            <Label>Fixpreis (Cent)</Label>
            <Input 
              type="number"
              value={formData.bundle_price} 
              onChange={e => setFormData({...formData, bundle_price: Number(e.target.value)})}
              placeholder="0 = berechnet"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Icon</Label>
            <Input 
              value={formData.icon} 
              onChange={e => setFormData({...formData, icon: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label>Farbe</Label>
            <Input 
              type="color"
              value={formData.color} 
              onChange={e => setFormData({...formData, color: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label>Sort Order</Label>
            <Input 
              type="number"
              value={formData.sort_order} 
              onChange={e => setFormData({...formData, sort_order: Number(e.target.value)})}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Switch 
            checked={formData.is_active} 
            onCheckedChange={v => setFormData({...formData, is_active: v})}
          />
          <Label>Bundle ist aktiv</Label>
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Abbrechen
        </Button>
        <Button type="submit" className="flex-1">
          <Check className="h-4 w-4 mr-2" />
          Speichern
        </Button>
      </div>
    </form>
  );
}