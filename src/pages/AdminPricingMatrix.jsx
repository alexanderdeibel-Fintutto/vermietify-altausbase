import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Check, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function AdminPricingMatrix() {
  const [editingPricing, setEditingPricing] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: plans = [] } = useQuery({
    queryKey: ['adminPlans'],
    queryFn: () => base44.entities.SubscriptionPlan.list('-sort_order')
  });

  const { data: addons = [] } = useQuery({
    queryKey: ['adminAddons'],
    queryFn: () => base44.entities.SubscriptionAddOn.list('-sort_order')
  });

  const { data: pricings = [] } = useQuery({
    queryKey: ['adminPricings'],
    queryFn: () => base44.entities.PlanAddOnPricing.list()
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PlanAddOnPricing.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPricings'] });
      setDialogOpen(false);
      setEditingPricing(null);
      toast.success('Preis aktualisiert');
    }
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PlanAddOnPricing.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPricings'] });
      setDialogOpen(false);
      setEditingPricing(null);
      toast.success('Preis erstellt');
    }
  });

  const getPricing = (planId, addonId) => {
    return pricings.find(p => p.plan_id === planId && p.addon_id === addonId);
  };

  const handleCellClick = (plan, addon) => {
    const existing = getPricing(plan.id, addon.id);
    if (existing) {
      setEditingPricing({ ...existing, plan, addon });
    } else {
      setEditingPricing({
        plan_id: plan.id,
        addon_id: addon.id,
        price_monthly: addon.base_price_monthly,
        stripe_price_id: '',
        is_included: false,
        is_available: true,
        discount_percent: 0,
        plan,
        addon
      });
    }
    setDialogOpen(true);
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-light text-slate-900">Pricing Matrix</h1>
        <p className="text-sm text-slate-600">Add-On Preise pro Plan konfigurieren</p>
      </div>

      <Card>
        <CardContent className="p-6 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-3 border-b font-medium text-sm">Add-On</th>
                {plans.map(plan => (
                  <th key={plan.id} className="text-center p-3 border-b font-medium text-sm">
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {addons.map(addon => (
                <tr key={addon.id} className="border-b hover:bg-slate-50">
                  <td className="p-3">
                    <div className="space-y-1">
                      <div className="font-medium text-sm">{addon.name}</div>
                      <Badge variant="secondary" className="text-xs">
                        {addon.category}
                      </Badge>
                    </div>
                  </td>
                  {plans.map(plan => {
                    const pricing = getPricing(plan.id, addon.id);
                    return (
                      <td 
                        key={plan.id} 
                        className="p-3 text-center cursor-pointer hover:bg-slate-100"
                        onClick={() => handleCellClick(plan, addon)}
                      >
                        {pricing ? (
                          <div className="space-y-1">
                            {pricing.is_included ? (
                              <Badge className="bg-emerald-100 text-emerald-700">Inklusive</Badge>
                            ) : pricing.is_available ? (
                              <>
                                <div className="text-sm font-medium">
                                  {(pricing.price_monthly / 100).toFixed(2)}€
                                </div>
                                {pricing.discount_percent > 0 && (
                                  <div className="text-xs text-emerald-600">
                                    -{pricing.discount_percent}%
                                  </div>
                                )}
                              </>
                            ) : (
                              <Badge variant="outline" className="text-xs">N/A</Badge>
                            )}
                          </div>
                        ) : (
                          <Button variant="ghost" size="sm" className="text-xs">
                            <Plus className="h-3 w-3 mr-1" />
                            Preis
                          </Button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPricing?.addon?.name} → {editingPricing?.plan?.name}
            </DialogTitle>
          </DialogHeader>
          {editingPricing && (
            <PricingForm 
              pricing={editingPricing}
              onSave={(data) => {
                if (editingPricing.id) {
                  updateMutation.mutate({ id: editingPricing.id, data });
                } else {
                  createMutation.mutate(data);
                }
              }}
              onCancel={() => {
                setDialogOpen(false);
                setEditingPricing(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PricingForm({ pricing, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    plan_id: pricing.plan_id,
    addon_id: pricing.addon_id,
    price_monthly: pricing.price_monthly,
    stripe_price_id: pricing.stripe_price_id || '',
    is_included: pricing.is_included,
    is_available: pricing.is_available,
    discount_percent: pricing.discount_percent || 0
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Preis Monatlich (Cent)</Label>
        <Input 
          type="number"
          value={formData.price_monthly} 
          onChange={e => setFormData({...formData, price_monthly: Number(e.target.value)})}
          required
          disabled={formData.is_included}
        />
      </div>

      <div className="space-y-2">
        <Label>Stripe Price ID</Label>
        <Input 
          value={formData.stripe_price_id} 
          onChange={e => setFormData({...formData, stripe_price_id: e.target.value})}
          placeholder="price_..."
        />
      </div>

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

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Switch 
            checked={formData.is_included} 
            onCheckedChange={v => setFormData({...formData, is_included: v, price_monthly: v ? 0 : pricing.addon.base_price_monthly})}
          />
          <Label>Im Plan inklusive</Label>
        </div>
        
        <div className="flex items-center gap-2">
          <Switch 
            checked={formData.is_available} 
            onCheckedChange={v => setFormData({...formData, is_available: v})}
          />
          <Label>Für diesen Plan verfügbar</Label>
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