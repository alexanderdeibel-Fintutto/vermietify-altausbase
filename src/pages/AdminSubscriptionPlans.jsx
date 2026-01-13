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
import { Plus, Edit, Trash2, Check, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSubscriptionPlans() {
  const [editingPlan, setEditingPlan] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const queryClient = useQueryClient();

  const { data: plans = [] } = useQuery({
    queryKey: ['adminPlans'],
    queryFn: () => base44.entities.SubscriptionPlan.list('-sort_order')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SubscriptionPlan.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPlans'] });
      setDialogOpen(false);
      setEditingPlan(null);
      toast.success('Plan erstellt');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SubscriptionPlan.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPlans'] });
      setDialogOpen(false);
      setEditingPlan(null);
      toast.success('Plan aktualisiert');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SubscriptionPlan.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPlans'] });
      toast.success('Plan gelöscht');
    }
  });

  const handleStripeSync = async () => {
    setSyncing(true);
    try {
      const response = await base44.functions.invoke('stripe/syncPlansToStripe', {});
      if (response.data.success) {
        toast.success(`${response.data.synced} von ${response.data.total} Plänen synchronisiert`);
        queryClient.invalidateQueries({ queryKey: ['adminPlans'] });
      } else {
        toast.error('Sync fehlgeschlagen');
      }
    } catch (error) {
      toast.error(error.message || 'Sync fehlgeschlagen');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light text-slate-900">Subscription-Pläne</h1>
          <p className="text-sm text-slate-600">Verwalte Tarife und Preise</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleStripeSync} disabled={syncing}>
            <Zap className="h-4 w-4 mr-2" />
            {syncing ? 'Sync läuft...' : 'Mit Stripe syncen'}
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingPlan(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Neuer Plan
            </Button>
          </DialogTrigger>
          </Dialog>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPlan ? 'Plan bearbeiten' : 'Neuer Plan'}</DialogTitle>
            </DialogHeader>
            <PlanForm 
              plan={editingPlan} 
              onSave={(data) => {
                if (editingPlan) {
                  updateMutation.mutate({ id: editingPlan.id, data });
                } else {
                  createMutation.mutate(data);
                }
              }}
              onCancel={() => {
                setDialogOpen(false);
                setEditingPlan(null);
              }}
            />
          </DialogContent>
      </Dialog>

      <div className="grid gap-4">
        {plans.map(plan => (
          <Card key={plan.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <CardTitle>{plan.name}</CardTitle>
                    {plan.badge_text && (
                      <Badge variant="secondary">{plan.badge_text}</Badge>
                    )}
                    {plan.is_default && (
                      <Badge variant="outline">Standard</Badge>
                    )}
                    {!plan.is_active && (
                      <Badge variant="destructive">Inaktiv</Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-600">{plan.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => {
                      setEditingPlan(plan);
                      setDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => {
                      if (confirm('Plan wirklich löschen?')) {
                        deleteMutation.mutate(plan.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-slate-600">Level:</span>
                  <span className="ml-2 font-medium">{plan.tier_level}</span>
                </div>
                <div>
                  <span className="text-slate-600">Monatlich:</span>
                  <span className="ml-2 font-medium">{(plan.price_monthly / 100).toFixed(2)}€</span>
                </div>
                <div>
                  <span className="text-slate-600">Jährlich:</span>
                  <span className="ml-2 font-medium">{plan.price_yearly ? `${(plan.price_yearly / 100).toFixed(2)}€` : '-'}</span>
                </div>
                <div>
                  <span className="text-slate-600">Trial:</span>
                  <span className="ml-2 font-medium">{plan.trial_days || 0} Tage</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function PlanForm({ plan, onSave, onCancel }) {
  const [formData, setFormData] = useState(plan || {
    name: '',
    slug: '',
    description: '',
    tier_level: 1,
    price_monthly: 0,
    price_yearly: 0,
    stripe_price_id_monthly: '',
    stripe_price_id_yearly: '',
    stripe_product_id: '',
    is_active: true,
    is_default: false,
    trial_days: 14,
    features_json: '[]',
    limits_json: '{}',
    sort_order: 0,
    badge_text: '',
    highlight: false
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

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Tier Level</Label>
          <Select value={String(formData.tier_level)} onValueChange={v => setFormData({...formData, tier_level: Number(v)})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 - Starter</SelectItem>
              <SelectItem value="2">2 - Pro</SelectItem>
              <SelectItem value="3">3 - Enterprise</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Preis Monatlich (Cent)</Label>
          <Input 
            type="number"
            value={formData.price_monthly} 
            onChange={e => setFormData({...formData, price_monthly: Number(e.target.value)})}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Preis Jährlich (Cent)</Label>
          <Input 
            type="number"
            value={formData.price_yearly} 
            onChange={e => setFormData({...formData, price_yearly: Number(e.target.value)})}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Stripe Price ID (Monatlich)</Label>
          <Input 
            value={formData.stripe_price_id_monthly} 
            onChange={e => setFormData({...formData, stripe_price_id_monthly: e.target.value})}
            placeholder="price_..."
          />
        </div>
        <div className="space-y-2">
          <Label>Stripe Price ID (Jährlich)</Label>
          <Input 
            value={formData.stripe_price_id_yearly} 
            onChange={e => setFormData({...formData, stripe_price_id_yearly: e.target.value})}
            placeholder="price_..."
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

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Trial Tage</Label>
          <Input 
            type="number"
            value={formData.trial_days} 
            onChange={e => setFormData({...formData, trial_days: Number(e.target.value)})}
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
        <div className="space-y-2">
          <Label>Badge Text</Label>
          <Input 
            value={formData.badge_text} 
            onChange={e => setFormData({...formData, badge_text: e.target.value})}
            placeholder="BELIEBT"
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
            checked={formData.is_default} 
            onCheckedChange={v => setFormData({...formData, is_default: v})}
          />
          <Label>Standard</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch 
            checked={formData.highlight} 
            onCheckedChange={v => setFormData({...formData, highlight: v})}
          />
          <Label>Highlight</Label>
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