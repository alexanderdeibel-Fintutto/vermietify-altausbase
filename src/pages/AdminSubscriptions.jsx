import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function AdminSubscriptions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['adminSubscriptions'],
    queryFn: () => base44.entities.UserSubscription.list('-created_date')
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['adminPlans'],
    queryFn: () => base44.entities.SubscriptionPlan.list()
  });

  const filteredSubs = subscriptions.filter(sub => {
    const matchesSearch = sub.user_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.status === 'active').length,
    trialing: subscriptions.filter(s => s.status === 'trialing').length,
    canceled: subscriptions.filter(s => s.status === 'canceled').length,
  };

  let totalMRR = 0;
  subscriptions.filter(s => ['active', 'trialing'].includes(s.status)).forEach(sub => {
    const plan = plans.find(p => p.id === sub.plan_id);
    if (plan) {
      totalMRR += sub.billing_cycle === 'yearly' ? plan.price_yearly / 12 : plan.price_monthly;
    }
  });

  const statusConfig = {
    trialing: { label: 'Testphase', variant: 'secondary', icon: AlertCircle },
    active: { label: 'Aktiv', variant: 'default', icon: CheckCircle2 },
    past_due: { label: 'Überfällig', variant: 'destructive', icon: AlertCircle },
    canceled: { label: 'Gekündigt', variant: 'outline', icon: AlertCircle },
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-light text-slate-900">Subscription-Übersicht</h1>
        <p className="text-sm text-slate-600">Alle Abonnements verwalten</p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-light">{stats.total}</div>
                <div className="text-xs text-slate-600">Gesamt</div>
              </div>
              <Users className="h-8 w-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-light text-emerald-600">{stats.active}</div>
                <div className="text-xs text-slate-600">Aktiv</div>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-light text-blue-600">{stats.trialing}</div>
                <div className="text-xs text-slate-600">Testphase</div>
              </div>
              <AlertCircle className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-light">{(totalMRR / 100).toFixed(0)}€</div>
                <div className="text-xs text-slate-600">MRR</div>
              </div>
              <TrendingUp className="h-8 w-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Input 
              placeholder="Nach Email suchen..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="active">Aktiv</SelectItem>
                <SelectItem value="trialing">Testphase</SelectItem>
                <SelectItem value="canceled">Gekündigt</SelectItem>
                <SelectItem value="past_due">Überfällig</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredSubs.map(sub => {
              const plan = plans.find(p => p.id === sub.plan_id);
              const status = statusConfig[sub.status] || statusConfig.active;
              const Icon = status.icon;

              return (
                <div key={sub.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
                  <div className="flex items-center gap-4">
                    <Icon className="h-5 w-5 text-slate-400" />
                    <div>
                      <div className="font-medium text-sm">{sub.user_email}</div>
                      <div className="text-xs text-slate-600">
                        {plan?.name} · {sub.billing_cycle === 'monthly' ? 'Monatlich' : 'Jährlich'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {format(new Date(sub.current_period_end), 'dd.MM.yyyy', { locale: de })}
                      </div>
                      <div className="text-xs text-slate-600">Nächste Zahlung</div>
                    </div>

                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Preis bearbeiten
            </DialogTitle>
          </DialogHeader>
          {editingPricing && (
            <PricingEditForm 
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

function PricingEditForm({ pricing, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    plan_id: pricing.plan_id,
    addon_id: pricing.addon_id,
    price_monthly: pricing.price_monthly,
    stripe_price_id: pricing.stripe_price_id || '',
    is_included: pricing.is_included,
    is_available: pricing.is_available,
    discount_percent: pricing.discount_percent || 0
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-4">
      <div className="space-y-2">
        <Label>Preis (Cent/Monat)</Label>
        <Input 
          type="number"
          value={formData.price_monthly} 
          onChange={e => setFormData({...formData, price_monthly: Number(e.target.value)})}
          disabled={formData.is_included}
        />
      </div>

      <div className="flex items-center gap-2">
        <Switch 
          checked={formData.is_included} 
          onCheckedChange={v => setFormData({...formData, is_included: v, price_monthly: v ? 0 : pricing.price_monthly})}
        />
        <Label>Inklusive</Label>
      </div>

      <div className="flex items-center gap-2">
        <Switch 
          checked={formData.is_available} 
          onCheckedChange={v => setFormData({...formData, is_available: v})}
        />
        <Label>Verfügbar</Label>
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Abbrechen
        </Button>
        <Button type="submit" className="flex-1">Speichern</Button>
      </div>
    </form>
  );
}