import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Settings, Tag, Shield, ArrowUpDown, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AdminPricingTiersV2() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState(null);
  const [deletingTier, setDeletingTier] = useState(null);
  const [filterProduct, setFilterProduct] = useState('all');

  const [formData, setFormData] = useState({
    product_id: '',
    tier_code: '',
    name: '',
    description: '',
    tier_level: 1,
    price_monthly: '',
    price_yearly: '',
    is_active: true,
    is_default: false,
    is_popular: false,
    trial_days: 0,
    max_users: 1,
    sort_order: 0,
    badge_text: ''
  });

  // Fetch data
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list('sort_order', 100),
  });

  const { data: tiers = [] } = useQuery({
    queryKey: ['pricingTiers'],
    queryFn: () => base44.entities.PricingTier.list('sort_order', 200),
  });

  const { data: tierFeatures = [] } = useQuery({
    queryKey: ['tierFeatures'],
    queryFn: () => base44.entities.TierFeature.list('-created_date', 1000),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PricingTier.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricingTiers'] });
      toast.success('Tarif erfolgreich erstellt');
      setDialogOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PricingTier.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricingTiers'] });
      toast.success('Tarif erfolgreich aktualisiert');
      setDialogOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PricingTier.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricingTiers'] });
      toast.success('Tarif erfolgreich gelöscht');
      setDeleteDialogOpen(false);
      setDeletingTier(null);
    },
  });

  const resetForm = () => {
    setFormData({
      product_id: '',
      tier_code: '',
      name: '',
      description: '',
      tier_level: 1,
      price_monthly: '',
      price_yearly: '',
      is_active: true,
      is_default: false,
      is_popular: false,
      trial_days: 0,
      max_users: 1,
      sort_order: 0,
      badge_text: ''
    });
    setEditingTier(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (tier) => {
    setEditingTier(tier);
    setFormData({
      product_id: tier.data.product_id,
      tier_code: tier.data.tier_code,
      name: tier.data.name,
      description: tier.data.description || '',
      tier_level: tier.data.tier_level,
      price_monthly: tier.data.price_monthly / 100,
      price_yearly: tier.data.price_yearly ? tier.data.price_yearly / 100 : '',
      is_active: tier.data.is_active,
      is_default: tier.data.is_default,
      is_popular: tier.data.is_popular,
      trial_days: tier.data.trial_days || 0,
      max_users: tier.data.max_users || 1,
      sort_order: tier.data.sort_order,
      badge_text: tier.data.badge_text || ''
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const payload = {
      ...formData,
      price_monthly: Math.round(parseFloat(formData.price_monthly) * 100),
      price_yearly: formData.price_yearly ? Math.round(parseFloat(formData.price_yearly) * 100) : null,
      tier_level: parseInt(formData.tier_level),
      trial_days: parseInt(formData.trial_days),
      max_users: parseInt(formData.max_users),
      sort_order: parseInt(formData.sort_order)
    };

    if (editingTier) {
      updateMutation.mutate({ id: editingTier.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const openDeleteDialog = (tier) => {
    setDeletingTier(tier);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deletingTier) {
      deleteMutation.mutate(deletingTier.id);
    }
  };

  // Filter tiers
  const filteredTiers = tiers.filter(tier => 
    filterProduct === 'all' || tier.data.product_id === filterProduct
  );

  // Count features per tier
  const getFeatureCount = (tierId) => {
    return tierFeatures.filter(tf => tf.data.tier_id === tierId).length;
  };

  const formatPrice = (cents) => {
    if (!cents) return '0,00€';
    return `${(cents / 100).toFixed(2).replace('.', ',')}€`;
  };

  const getProductName = (productId) => {
    const product = products.find(p => p.id === productId);
    return product ? product.data.name : 'Unbekannt';
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-light text-slate-900">Tarife verwalten</h1>
          <p className="text-slate-600 mt-1">Preis-Stufen für Produkte konfigurieren</p>
        </div>
        <Button onClick={openCreateDialog} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Neuer Tarif
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Produkt filtern</Label>
              <Select value={filterProduct} onValueChange={setFilterProduct}>
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
          </div>
        </CardContent>
      </Card>

      {/* Tiers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="font-light">Alle Tarife ({filteredTiers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-normal text-slate-600">Produkt</th>
                  <th className="text-left py-3 px-4 font-normal text-slate-600">Code</th>
                  <th className="text-left py-3 px-4 font-normal text-slate-600">Name</th>
                  <th className="text-left py-3 px-4 font-normal text-slate-600">Level</th>
                  <th className="text-left py-3 px-4 font-normal text-slate-600">Preis/Monat</th>
                  <th className="text-left py-3 px-4 font-normal text-slate-600">Preis/Jahr</th>
                  <th className="text-left py-3 px-4 font-normal text-slate-600">Status</th>
                  <th className="text-left py-3 px-4 font-normal text-slate-600">Features</th>
                  <th className="text-left py-3 px-4 font-normal text-slate-600">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filteredTiers.map(tier => (
                  <tr key={tier.id} className="border-b hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <span className="text-sm">{getProductName(tier.data.product_id)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                        {tier.data.tier_code}
                      </code>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span>{tier.data.name}</span>
                        {tier.data.badge_text && (
                          <Badge className="bg-amber-500">{tier.data.badge_text}</Badge>
                        )}
                        {tier.data.is_popular && (
                          <Badge className="bg-purple-500">BELIEBT</Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline">Level {tier.data.tier_level}</Badge>
                    </td>
                    <td className="py-3 px-4 font-mono text-sm">
                      {formatPrice(tier.data.price_monthly)}
                    </td>
                    <td className="py-3 px-4 font-mono text-sm">
                      {formatPrice(tier.data.price_yearly)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        {tier.data.is_active ? (
                          <Badge className="bg-green-500">Aktiv</Badge>
                        ) : (
                          <Badge variant="outline">Inaktiv</Badge>
                        )}
                        {tier.data.is_default && (
                          <Badge className="bg-blue-500">Standard</Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Link to={`${createPageUrl('AdminPricingTierFeatures')}?id=${tier.id}`}>
                          <Button variant="ghost" size="sm">
                            <Tag className="w-4 h-4 mr-1" />
                            {getFeatureCount(tier.id)}
                          </Button>
                        </Link>
                        <Link to={`${createPageUrl('AdminPricingTierLimits')}?id=${tier.id}`}>
                          <Button variant="ghost" size="sm">
                            <Shield className="w-4 h-4 mr-1" />
                            Limits
                          </Button>
                        </Link>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(tier)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(tier)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredTiers.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                Keine Tarife vorhanden. Erstelle deinen ersten Tarif.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTier ? 'Tarif bearbeiten' : 'Neuer Tarif'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Produkt */}
            <div>
              <Label>Produkt *</Label>
              <Select 
                value={formData.product_id} 
                onValueChange={(value) => setFormData({...formData, product_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Produkt wählen" />
                </SelectTrigger>
                <SelectContent>
                  {products.filter(p => p.data.is_active).map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.data.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Code & Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Code * (UPPERCASE)</Label>
                <Input
                  value={formData.tier_code}
                  onChange={(e) => setFormData({...formData, tier_code: e.target.value.toUpperCase()})}
                  placeholder="FREE, STARTER, PRO"
                  required
                />
              </div>
              <div>
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Starter"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <Label>Beschreibung</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Perfekt für Einsteiger..."
                rows={3}
              />
            </div>

            {/* Tier Level */}
            <div>
              <Label>Tier-Level * (1-5, höher = teurer)</Label>
              <Input
                type="number"
                min="1"
                max="5"
                value={formData.tier_level}
                onChange={(e) => setFormData({...formData, tier_level: e.target.value})}
                required
              />
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Preis Monatlich * (EUR)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price_monthly}
                  onChange={(e) => setFormData({...formData, price_monthly: e.target.value})}
                  placeholder="9.90"
                  required
                />
              </div>
              <div>
                <Label>Preis Jährlich (EUR)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price_yearly}
                  onChange={(e) => setFormData({...formData, price_yearly: e.target.value})}
                  placeholder="99.00"
                />
              </div>
            </div>

            {/* Trial & Limits */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Test-Tage</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.trial_days}
                  onChange={(e) => setFormData({...formData, trial_days: e.target.value})}
                />
              </div>
              <div>
                <Label>Max. Nutzer</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.max_users}
                  onChange={(e) => setFormData({...formData, max_users: e.target.value})}
                />
              </div>
            </div>

            {/* Badge */}
            <div>
              <Label>Badge-Text (optional)</Label>
              <Input
                value={formData.badge_text}
                onChange={(e) => setFormData({...formData, badge_text: e.target.value})}
                placeholder="EMPFOHLEN, AM BELIEBTESTEN"
              />
            </div>

            {/* Sort Order */}
            <div>
              <Label>Reihenfolge</Label>
              <Input
                type="number"
                min="0"
                value={formData.sort_order}
                onChange={(e) => setFormData({...formData, sort_order: e.target.value})}
              />
            </div>

            {/* Checkboxes */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                />
                <Label>Tarif ist aktiv (buchbar)</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.is_default}
                  onCheckedChange={(checked) => setFormData({...formData, is_default: checked})}
                />
                <Label>Als Standard-Tarif markieren</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.is_popular}
                  onCheckedChange={(checked) => setFormData({...formData, is_popular: checked})}
                />
                <Label>Als beliebt hervorheben</Label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {editingTier ? 'Aktualisieren' : 'Erstellen'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tarif löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du den Tarif "{deletingTier?.data.name}" wirklich löschen? 
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}