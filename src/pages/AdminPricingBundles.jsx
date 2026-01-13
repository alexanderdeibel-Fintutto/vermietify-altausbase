import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Package } from 'lucide-react';

export default function AdminPricingBundles() {
  const queryClient = useQueryClient();
  const [editingBundle, setEditingBundle] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: bundles = [] } = useQuery({
    queryKey: ['bundles'],
    queryFn: () => base44.entities.Bundle.list('-sort_order')
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list()
  });

  const { data: tiers = [] } = useQuery({
    queryKey: ['tiers'],
    queryFn: () => base44.entities.PricingTier.list()
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editingBundle?.id) {
        return await base44.entities.Bundle.update(editingBundle.id, data);
      } else {
        return await base44.entities.Bundle.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bundles'] });
      setDialogOpen(false);
      setEditingBundle(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.Bundle.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bundles'] });
    }
  });

  const formatCurrency = (cents) => cents ? `${(cents / 100).toFixed(2)}€` : '0€';

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-slate-900">Bundle-Pakete</h1>
          <p className="text-slate-600 mt-1">Verwalte kombinierte Angebote</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingBundle(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Neues Bundle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingBundle ? 'Bundle bearbeiten' : 'Neues Bundle'}</DialogTitle>
            </DialogHeader>
            <BundleForm
              bundle={editingBundle}
              onSave={(data) => saveMutation.mutate(data)}
              onCancel={() => {
                setDialogOpen(false);
                setEditingBundle(null);
              }}
              isSaving={saveMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {bundles.map(bundle => (
          <Card key={bundle.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-slate-400" />
                    <h3 className="text-lg font-light">{bundle.data.name}</h3>
                    {bundle.data.is_highlighted && bundle.data.highlight_text && (
                      <Badge variant="secondary">{bundle.data.highlight_text}</Badge>
                    )}
                    {bundle.data.is_active ? (
                      <Badge>Aktiv</Badge>
                    ) : (
                      <Badge variant="outline">Inaktiv</Badge>
                    )}
                  </div>
                  
                  <p className="text-slate-600 mt-1 text-sm">{bundle.data.tagline}</p>
                  
                  <div className="flex gap-6 mt-3 text-sm">
                    <div>
                      <span className="text-slate-500">Monatlich:</span>{' '}
                      <span className="font-medium">{formatCurrency(bundle.data.price_monthly)}</span>
                    </div>
                    {bundle.data.price_yearly && (
                      <div>
                        <span className="text-slate-500">Jährlich:</span>{' '}
                        <span className="font-medium">{formatCurrency(bundle.data.price_yearly)}</span>
                      </div>
                    )}
                    {bundle.data.savings_percent && (
                      <div className="text-green-600">
                        Ersparnis: {bundle.data.savings_percent}%
                      </div>
                    )}
                  </div>
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
                    <Edit className="w-4 h-4" />
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
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {bundles.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-slate-400">
              Noch keine Bundles erstellt
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function BundleForm({ bundle, onSave, onCancel, isSaving }) {
  const [formData, setFormData] = useState(bundle?.data || {
    bundle_code: '',
    name: '',
    description: '',
    tagline: '',
    icon: 'Package',
    price_monthly: 0,
    price_yearly: 0,
    savings_percent: 0,
    savings_amount_monthly: 0,
    billing_intervals: '["MONTHLY", "YEARLY"]',
    is_active: false,
    is_highlighted: false,
    highlight_text: '',
    sort_order: 0
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Code *</Label>
          <Input
            value={formData.bundle_code}
            onChange={(e) => setFormData({ ...formData, bundle_code: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Name *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Tagline</Label>
        <Input
          value={formData.tagline}
          onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Beschreibung</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Preis/Monat (€)</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.price_monthly / 100}
            onChange={(e) => setFormData({ ...formData, price_monthly: Math.round(parseFloat(e.target.value) * 100) })}
          />
        </div>
        <div className="space-y-2">
          <Label>Preis/Jahr (€)</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.price_yearly / 100}
            onChange={(e) => setFormData({ ...formData, price_yearly: Math.round(parseFloat(e.target.value) * 100) })}
          />
        </div>
        <div className="space-y-2">
          <Label>Ersparnis (%)</Label>
          <Input
            type="number"
            value={formData.savings_percent}
            onChange={(e) => setFormData({ ...formData, savings_percent: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Highlight-Text</Label>
          <Input
            value={formData.highlight_text}
            onChange={(e) => setFormData({ ...formData, highlight_text: e.target.value })}
            placeholder="BESTSELLER, SPAR-TIPP"
          />
        </div>
        <div className="space-y-2">
          <Label>Sortierung</Label>
          <Input
            type="number"
            value={formData.sort_order}
            onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex items-center gap-2">
          <Switch
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
          <Label>Aktiv</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={formData.is_highlighted}
            onCheckedChange={(checked) => setFormData({ ...formData, is_highlighted: checked })}
          />
          <Label>Hervorheben</Label>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Speichere...' : 'Speichern'}
        </Button>
      </div>
    </form>
  );
}