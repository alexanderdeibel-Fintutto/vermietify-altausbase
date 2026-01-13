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
import { Plus, Edit, Trash2, Check, Settings, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminPricingTiers() {
  const [editingTier, setEditingTier] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('all');
  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ['adminProducts'],
    queryFn: () => base44.entities.Product.list('-sort_order')
  });

  const { data: tiers = [] } = useQuery({
    queryKey: ['pricingTiers'],
    queryFn: () => base44.entities.PricingTier.list('-tier_level')
  });

  const { data: tierFeatures = [] } = useQuery({
    queryKey: ['tierFeatures'],
    queryFn: () => base44.entities.TierFeature.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PricingTier.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricingTiers'] });
      setDialogOpen(false);
      setEditingTier(null);
      toast.success('Tarif erstellt');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PricingTier.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricingTiers'] });
      setDialogOpen(false);
      setEditingTier(null);
      toast.success('Tarif aktualisiert');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PricingTier.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricingTiers'] });
      toast.success('Tarif gelöscht');
    }
  });

  const filteredTiers = tiers.filter(t => 
    selectedProduct === 'all' || t.product_id === selectedProduct
  );

  const getProduct = (productId) => products.find(p => p.id === productId);
  const getFeatureCount = (tierId) => {
    return tierFeatures.filter(tf => tf.tier_id === tierId && tf.inclusion_type === 'INCLUDED').length;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light text-slate-900">Tarife</h1>
          <p className="text-sm text-slate-600">Verwalte Pricing-Stufen pro Produkt</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingTier(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Neuer Tarif
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTier ? 'Tarif bearbeiten' : 'Neuer Tarif'}</DialogTitle>
            </DialogHeader>
            <TierForm 
              tier={editingTier}
              products={products}
              onSave={(data) => {
                if (editingTier) {
                  updateMutation.mutate({ id: editingTier.id, data });
                } else {
                  createMutation.mutate(data);
                }
              }}
              onCancel={() => {
                setDialogOpen(false);
                setEditingTier(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div>
        <Select value={selectedProduct} onValueChange={setSelectedProduct}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Produkte</SelectItem>
            {products.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredTiers.map(tier => {
          const product = getProduct(tier.product_id);
          
          return (
            <Card key={tier.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg">{tier.name}</CardTitle>
                      {product && (
                        <Badge variant="outline" style={{ color: product.color }}>
                          {product.name}
                        </Badge>
                      )}
                      {tier.is_popular && (
                        <Badge className="bg-yellow-500 text-slate-900">⭐ Beliebt</Badge>
                      )}
                      {tier.is_default && (
                        <Badge className="bg-green-100 text-green-700">Standard</Badge>
                      )}
                      {!tier.is_active && (
                        <Badge variant="outline">Inaktiv</Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-600">{tier.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      asChild
                    >
                      <Link to={createPageUrl(`AdminTierFeatures?tier=${tier.id}`)}>
                        <Settings className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        setEditingTier(tier);
                        setDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        if (confirm('Tarif wirklich löschen?')) {
                          deleteMutation.mutate(tier.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600">Level:</span>
                    <span className="ml-2 font-medium">{tier.tier_level}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">Monatlich:</span>
                    <span className="ml-2 font-medium">{(tier.price_monthly / 100).toFixed(2)}€</span>
                  </div>
                  <div>
                    <span className="text-slate-600">Jährlich:</span>
                    <span className="ml-2 font-medium">
                      {tier.price_yearly ? `${(tier.price_yearly / 100).toFixed(2)}€` : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-600">Trial:</span>
                    <span className="ml-2 font-medium">{tier.trial_days || 0} Tage</span>
                  </div>
                  <div>
                    <span className="text-slate-600">Features:</span>
                    <span className="ml-2 font-medium">{getFeatureCount(tier.id)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function TierForm({ tier, products, onSave, onCancel }) {
  const [formData, setFormData] = useState(tier || {
    product_id: products[0]?.id || '',
    tier_code: '',
    name: '',
    description: '',
    tier_level: 1,
    price_monthly: 0,
    price_yearly: 0,
    stripe_price_id_monthly: '',
    stripe_price_id_yearly: '',
    stripe_product_id: '',
    is_active: true,
    is_default: false,
    is_popular: false,
    trial_days: 0,
    max_users: -1,
    billing_interval_options: '["monthly", "yearly"]',
    sort_order: 0,
    badge_text: '',
    metadata: '{}'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-medium text-slate-900">Grunddaten</h3>
        
        <div className="space-y-2">
          <Label>Produkt *</Label>
          <Select value={formData.product_id} onValueChange={v => setFormData({...formData, product_id: v})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {products.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Code *</Label>
            <Input 
              value={formData.tier_code} 
              onChange={e => setFormData({...formData, tier_code: e.target.value.toUpperCase()})}
              placeholder="FREE, STARTER, PRO"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="Starter"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Beschreibung</Label>
          <Textarea 
            value={formData.description} 
            onChange={e => setFormData({...formData, description: e.target.value})}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label>Tier Level *</Label>
          <Select value={String(formData.tier_level)} onValueChange={v => setFormData({...formData, tier_level: Number(v)})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 - Basic</SelectItem>
              <SelectItem value="2">2 - Starter</SelectItem>
              <SelectItem value="3">3 - Pro</SelectItem>
              <SelectItem value="4">4 - Business</SelectItem>
              <SelectItem value="5">5 - Enterprise</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t">
        <h3 className="font-medium text-slate-900">Preisgestaltung</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Preis Monatlich (Cent) *</Label>
            <Input 
              type="number"
              value={formData.price_monthly} 
              onChange={e => setFormData({...formData, price_monthly: Number(e.target.value)})}
              placeholder="1990"
              required
            />
            <p className="text-xs text-slate-500">
              = {(formData.price_monthly / 100).toFixed(2)}€
            </p>
          </div>
          <div className="space-y-2">
            <Label>Preis Jährlich (Cent)</Label>
            <Input 
              type="number"
              value={formData.price_yearly} 
              onChange={e => setFormData({...formData, price_yearly: Number(e.target.value)})}
              placeholder="19900"
            />
            {formData.price_yearly > 0 && (
              <p className="text-xs text-slate-500">
                = {(formData.price_yearly / 100).toFixed(2)}€
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Trial Tage</Label>
            <Input 
              type="number"
              value={formData.trial_days} 
              onChange={e => setFormData({...formData, trial_days: Number(e.target.value)})}
            />
          </div>
          <div className="space-y-2">
            <Label>Max. Team-Mitglieder</Label>
            <Input 
              type="number"
              value={formData.max_users} 
              onChange={e => setFormData({...formData, max_users: Number(e.target.value)})}
              placeholder="-1 = unbegrenzt"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Badge Text</Label>
          <Input 
            value={formData.badge_text} 
            onChange={e => setFormData({...formData, badge_text: e.target.value})}
            placeholder="BELIEBT, EMPFOHLEN"
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

      <div className="space-y-4 pt-4 border-t">
        <h3 className="font-medium text-slate-900">Status</h3>
        
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Switch 
              checked={formData.is_active} 
              onCheckedChange={v => setFormData({...formData, is_active: v})}
            />
            <Label>Tarif ist aktiv</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch 
              checked={formData.is_default} 
              onCheckedChange={v => setFormData({...formData, is_default: v})}
            />
            <Label>Standard für neue User</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch 
              checked={formData.is_popular} 
              onCheckedChange={v => setFormData({...formData, is_popular: v})}
            />
            <Label>Als "Beliebt" markieren</Label>
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