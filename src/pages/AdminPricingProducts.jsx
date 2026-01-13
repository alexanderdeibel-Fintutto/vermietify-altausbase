import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Check, Eye, Settings } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminPricingProducts() {
  const [editingProduct, setEditingProduct] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ['adminProducts'],
    queryFn: () => base44.entities.Product.list('-sort_order')
  });

  const { data: productFeatures = [] } = useQuery({
    queryKey: ['productFeatures'],
    queryFn: () => base44.entities.ProductFeature.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Product.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      setDialogOpen(false);
      setEditingProduct(null);
      toast.success('Produkt erstellt');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Product.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      setDialogOpen(false);
      setEditingProduct(null);
      toast.success('Produkt aktualisiert');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Product.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      toast.success('Produkt gelöscht');
    }
  });

  const filteredProducts = products.filter(p => 
    categoryFilter === 'all' || p.category === categoryFilter
  );

  const getFeatureCount = (productId) => {
    return productFeatures.filter(pf => pf.product_id === productId).length;
  };

  const categoryColors = {
    CORE: 'bg-emerald-100 text-emerald-700',
    ADD_ON: 'bg-blue-100 text-blue-700',
    STANDALONE: 'bg-purple-100 text-purple-700',
    MARKETPLACE: 'bg-amber-100 text-amber-700',
    FREEMIUM: 'bg-slate-100 text-slate-700'
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light text-slate-900">Produkte</h1>
          <p className="text-sm text-slate-600">Verwalte dein App-Portfolio</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingProduct(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Neues Produkt
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Produkt bearbeiten' : 'Neues Produkt'}</DialogTitle>
            </DialogHeader>
            <ProductForm 
              product={editingProduct}
              products={products}
              onSave={(data) => {
                if (editingProduct) {
                  updateMutation.mutate({ id: editingProduct.id, data });
                } else {
                  createMutation.mutate(data);
                }
              }}
              onCancel={() => {
                setDialogOpen(false);
                setEditingProduct(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-3">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Kategorien</SelectItem>
            <SelectItem value="CORE">Core</SelectItem>
            <SelectItem value="ADD_ON">Add-On</SelectItem>
            <SelectItem value="STANDALONE">Standalone</SelectItem>
            <SelectItem value="MARKETPLACE">Marketplace</SelectItem>
            <SelectItem value="FREEMIUM">Freemium</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredProducts.map(product => (
          <Card key={product.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <Badge className={categoryColors[product.category]}>
                      {product.category}
                    </Badge>
                    {product.is_active ? (
                      <Badge className="bg-green-100 text-green-700">Aktiv</Badge>
                    ) : product.is_coming_soon ? (
                      <Badge className="bg-blue-100 text-blue-700">Coming Soon</Badge>
                    ) : (
                      <Badge variant="outline">Inaktiv</Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-600">{product.description}</p>
                  <div className="text-xs text-slate-500">
                    Code: <code className="bg-slate-100 px-1 rounded">{product.product_code}</code>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    asChild
                  >
                    <Link to={createPageUrl(`AdminProductFeatures?product=${product.id}`)}>
                      <Settings className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => {
                      setEditingProduct(product);
                      setDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => {
                      if (confirm('Produkt wirklich löschen?')) {
                        deleteMutation.mutate(product.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <span className="text-slate-600">Features:</span>
                  <span className="ml-2 font-medium">{getFeatureCount(product.id)}</span>
                </div>
                {product.icon && (
                  <div>
                    <span className="text-slate-600">Icon:</span>
                    <span className="ml-2 font-medium">{product.icon}</span>
                  </div>
                )}
                {product.color && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600">Farbe:</span>
                    <div className="w-4 h-4 rounded border" style={{ backgroundColor: product.color }} />
                    <span className="text-xs font-mono">{product.color}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ProductForm({ product, products, onSave, onCancel }) {
  const [formData, setFormData] = useState(product || {
    product_code: '',
    name: '',
    description: '',
    category: 'CORE',
    target_audience: '[]',
    base_product_id: '',
    icon: 'Building2',
    color: '#10B981',
    is_active: false,
    is_coming_soon: false,
    launch_date: '',
    sort_order: 0,
    metadata: '{}'
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
              value={formData.product_code} 
              onChange={e => setFormData({...formData, product_code: e.target.value.toUpperCase()})}
              placeholder="VERMIETER_PRO"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="Vermieter Pro"
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
            <Label>Kategorie *</Label>
            <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CORE">Core</SelectItem>
                <SelectItem value="ADD_ON">Add-On</SelectItem>
                <SelectItem value="STANDALONE">Standalone</SelectItem>
                <SelectItem value="MARKETPLACE">Marketplace</SelectItem>
                <SelectItem value="FREEMIUM">Freemium</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {formData.category === 'ADD_ON' && (
            <div className="space-y-2">
              <Label>Basis-Produkt</Label>
              <Select value={formData.base_product_id} onValueChange={v => setFormData({...formData, base_product_id: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {products.filter(p => p.category === 'CORE' || p.category === 'STANDALONE').map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Icon</Label>
            <Input 
              value={formData.icon} 
              onChange={e => setFormData({...formData, icon: e.target.value})}
              placeholder="Building2"
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

        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <Switch 
              checked={formData.is_active} 
              onCheckedChange={v => setFormData({...formData, is_active: v})}
            />
            <Label>Aktiv</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch 
              checked={formData.is_coming_soon} 
              onCheckedChange={v => setFormData({...formData, is_coming_soon: v})}
            />
            <Label>Coming Soon</Label>
          </div>
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