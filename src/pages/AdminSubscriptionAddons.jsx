import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSubscriptionAddons() {
  const [editingAddon, setEditingAddon] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: addons = [] } = useQuery({
    queryKey: ['adminAddons'],
    queryFn: () => base44.entities.SubscriptionAddOn.list('-sort_order')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SubscriptionAddOn.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAddons'] });
      setDialogOpen(false);
      setEditingAddon(null);
      toast.success('Add-On erstellt');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SubscriptionAddOn.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAddons'] });
      setDialogOpen(false);
      setEditingAddon(null);
      toast.success('Add-On aktualisiert');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SubscriptionAddOn.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAddons'] });
      toast.success('Add-On gelöscht');
    }
  });

  const categoryNames = {
    integration: 'Integration',
    feature: 'Feature',
    limit_extension: 'Limit-Erweiterung',
    support: 'Support'
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light text-slate-900">Add-Ons</h1>
          <p className="text-sm text-slate-600">Verwalte optionale Module</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingAddon(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Neues Add-On
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAddon ? 'Add-On bearbeiten' : 'Neues Add-On'}</DialogTitle>
            </DialogHeader>
            <AddonForm 
              addon={editingAddon} 
              onSave={(data) => {
                if (editingAddon) {
                  updateMutation.mutate({ id: editingAddon.id, data });
                } else {
                  createMutation.mutate(data);
                }
              }}
              onCancel={() => {
                setDialogOpen(false);
                setEditingAddon(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {addons.map(addon => (
          <Card key={addon.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base">{addon.name}</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {categoryNames[addon.category]}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => {
                      setEditingAddon(addon);
                      setDialogOpen(true);
                    }}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => {
                      if (confirm('Add-On wirklich löschen?')) {
                        deleteMutation.mutate(addon.id);
                      }
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-slate-600 text-xs">{addon.description}</p>
              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-600">Basispreis:</span>
                <span className="font-medium">{(addon.base_price_monthly / 100).toFixed(2)}€/Mon</span>
              </div>
              {!addon.is_active && (
                <Badge variant="destructive" className="text-xs">Inaktiv</Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AddonForm({ addon, onSave, onCancel }) {
  const [formData, setFormData] = useState(addon || {
    name: '',
    slug: '',
    description: '',
    icon: '',
    category: 'feature',
    base_price_monthly: 0,
    stripe_product_id: '',
    is_active: true,
    requires_setup: false,
    setup_fee: 0,
    features_json: '[]',
    limits_json: '{}',
    sort_order: 0,
    dependencies: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Slug</Label>
          <Input 
            value={formData.slug} 
            onChange={e => setFormData({...formData, slug: e.target.value})}
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Kategorie</Label>
          <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="integration">Integration</SelectItem>
              <SelectItem value="feature">Feature</SelectItem>
              <SelectItem value="limit_extension">Limit-Erweiterung</SelectItem>
              <SelectItem value="support">Support</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Icon Name</Label>
          <Input 
            value={formData.icon} 
            onChange={e => setFormData({...formData, icon: e.target.value})}
            placeholder="Building2"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Basispreis (Cent/Monat)</Label>
          <Input 
            type="number"
            value={formData.base_price_monthly} 
            onChange={e => setFormData({...formData, base_price_monthly: Number(e.target.value)})}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Setup Fee (Cent)</Label>
          <Input 
            type="number"
            value={formData.setup_fee} 
            onChange={e => setFormData({...formData, setup_fee: Number(e.target.value)})}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Stripe Product ID</Label>
        <Input 
          value={formData.stripe_product_id} 
          onChange={e => setFormData({...formData, stripe_product_id: e.target.value})}
          placeholder="prod_..."
        />
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
            checked={formData.requires_setup} 
            onCheckedChange={v => setFormData({...formData, requires_setup: v})}
          />
          <Label>Setup erforderlich</Label>
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