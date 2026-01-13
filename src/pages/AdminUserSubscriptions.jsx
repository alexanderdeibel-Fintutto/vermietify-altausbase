import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, Edit, Calendar, CreditCard, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function AdminUserSubscriptions() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTier, setFilterTier] = useState('all');

  const [formData, setFormData] = useState({
    user_email: '',
    tier_id: '',
    status: 'TRIAL',
    billing_cycle: 'MONTHLY',
    trial_days: 14,
    auto_renew: true
  });

  // Fetch data
  const { data: subscriptions = [] } = useQuery({
    queryKey: ['userSubscriptions'],
    queryFn: () => base44.entities.UserSubscription.list('-created_date', 500),
  });

  const { data: tiers = [] } = useQuery({
    queryKey: ['pricingTiers'],
    queryFn: () => base44.entities.PricingTier.list('sort_order', 100),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => {
      const now = new Date();
      const trialEndDate = new Date(now);
      trialEndDate.setDate(trialEndDate.getDate() + parseInt(data.trial_days));

      return base44.entities.UserSubscription.create({
        ...data,
        trial_start_date: now.toISOString().split('T')[0],
        trial_end_date: trialEndDate.toISOString().split('T')[0]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSubscriptions'] });
      toast.success('Subscription erstellt');
      setDialogOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.UserSubscription.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSubscriptions'] });
      toast.success('Subscription aktualisiert');
      setDialogOpen(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({
      user_email: '',
      tier_id: '',
      status: 'TRIAL',
      billing_cycle: 'MONTHLY',
      trial_days: 14,
      auto_renew: true
    });
    setEditingSubscription(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (subscription) => {
    setEditingSubscription(subscription);
    setFormData({
      user_email: subscription.data.user_email,
      tier_id: subscription.data.tier_id,
      status: subscription.data.status,
      billing_cycle: subscription.data.billing_cycle,
      auto_renew: subscription.data.auto_renew,
      trial_days: 14
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingSubscription) {
      updateMutation.mutate({ id: editingSubscription.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Filter & Search
  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = !searchQuery || 
      sub.data.user_email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || sub.data.status === filterStatus;
    const matchesTier = filterTier === 'all' || sub.data.tier_id === filterTier;
    return matchesSearch && matchesStatus && matchesTier;
  });

  // Helper functions
  const getTierName = (tierId) => {
    const tier = tiers.find(t => t.id === tierId);
    return tier?.data.name || 'Unbekannt';
  };

  const getProductName = (tierId) => {
    const tier = tiers.find(t => t.id === tierId);
    if (!tier) return 'Unbekannt';
    const product = products.find(p => p.id === tier.data.product_id);
    return product?.data.name || 'Unbekannt';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'TRIAL': return 'bg-blue-500';
      case 'ACTIVE': return 'bg-green-500';
      case 'CANCELLED': return 'bg-orange-500';
      case 'EXPIRED': return 'bg-red-500';
      case 'SUSPENDED': return 'bg-slate-500';
      default: return 'bg-slate-500';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd.MM.yyyy');
    } catch {
      return dateString;
    }
  };

  // Stats
  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.data.status === 'ACTIVE').length,
    trial: subscriptions.filter(s => s.data.status === 'TRIAL').length,
    cancelled: subscriptions.filter(s => s.data.status === 'CANCELLED').length
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-light text-slate-900">User Subscriptions</h1>
          <p className="text-slate-600 mt-1">Benutzer-Abonnements verwalten</p>
        </div>
        <Button onClick={openCreateDialog} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Neue Subscription
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Gesamt</p>
                <p className="text-2xl font-light">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Aktiv</p>
                <p className="text-2xl font-light text-green-600">{stats.active}</p>
              </div>
              <CreditCard className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Trial</p>
                <p className="text-2xl font-light text-blue-600">{stats.trial}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Gekündigt</p>
                <p className="text-2xl font-light text-orange-600">{stats.cancelled}</p>
              </div>
              <Calendar className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Suche (Email)</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Email suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Status</SelectItem>
                  <SelectItem value="TRIAL">Trial</SelectItem>
                  <SelectItem value="ACTIVE">Aktiv</SelectItem>
                  <SelectItem value="CANCELLED">Gekündigt</SelectItem>
                  <SelectItem value="EXPIRED">Abgelaufen</SelectItem>
                  <SelectItem value="SUSPENDED">Suspendiert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tarif</Label>
              <Select value={filterTier} onValueChange={setFilterTier}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Tarife</SelectItem>
                  {tiers.map(tier => (
                    <SelectItem key={tier.id} value={tier.id}>
                      {tier.data.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="font-light">Subscriptions ({filteredSubscriptions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-normal text-slate-600">Benutzer</th>
                  <th className="text-left py-3 px-4 font-normal text-slate-600">Produkt</th>
                  <th className="text-left py-3 px-4 font-normal text-slate-600">Tarif</th>
                  <th className="text-left py-3 px-4 font-normal text-slate-600">Status</th>
                  <th className="text-left py-3 px-4 font-normal text-slate-600">Abrechnung</th>
                  <th className="text-left py-3 px-4 font-normal text-slate-600">Trial Ende</th>
                  <th className="text-left py-3 px-4 font-normal text-slate-600">Nächste Rechnung</th>
                  <th className="text-left py-3 px-4 font-normal text-slate-600">Auto-Renew</th>
                  <th className="text-left py-3 px-4 font-normal text-slate-600">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubscriptions.map(subscription => (
                  <tr key={subscription.id} className="border-b hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <span className="text-sm">{subscription.data.user_email}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm">{getProductName(subscription.data.tier_id)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline">{getTierName(subscription.data.tier_id)}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={getStatusColor(subscription.data.status)}>
                        {subscription.data.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm">{subscription.data.billing_cycle}</span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {formatDate(subscription.data.trial_end_date)}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {formatDate(subscription.data.next_billing_date)}
                    </td>
                    <td className="py-3 px-4">
                      {subscription.data.auto_renew ? (
                        <Badge className="bg-green-500">Ja</Badge>
                      ) : (
                        <Badge variant="outline">Nein</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(subscription)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredSubscriptions.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                Keine Subscriptions gefunden.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingSubscription ? 'Subscription bearbeiten' : 'Neue Subscription'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* User Email */}
            <div>
              <Label>Benutzer Email *</Label>
              <Input
                type="email"
                value={formData.user_email}
                onChange={(e) => setFormData({...formData, user_email: e.target.value})}
                placeholder="user@example.com"
                required
                disabled={!!editingSubscription}
              />
            </div>

            {/* Tier */}
            <div>
              <Label>Tarif *</Label>
              <Select 
                value={formData.tier_id} 
                onValueChange={(value) => setFormData({...formData, tier_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tarif wählen" />
                </SelectTrigger>
                <SelectContent>
                  {tiers.filter(t => t.data.is_active).map(tier => (
                    <SelectItem key={tier.id} value={tier.id}>
                      {tier.data.name} - {getProductName(tier.id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div>
              <Label>Status *</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData({...formData, status: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRIAL">Trial</SelectItem>
                  <SelectItem value="ACTIVE">Aktiv</SelectItem>
                  <SelectItem value="CANCELLED">Gekündigt</SelectItem>
                  <SelectItem value="EXPIRED">Abgelaufen</SelectItem>
                  <SelectItem value="SUSPENDED">Suspendiert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Billing Cycle */}
            <div>
              <Label>Abrechnungszyklus *</Label>
              <Select 
                value={formData.billing_cycle} 
                onValueChange={(value) => setFormData({...formData, billing_cycle: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONTHLY">Monatlich</SelectItem>
                  <SelectItem value="YEARLY">Jährlich</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Trial Days (only for new) */}
            {!editingSubscription && (
              <div>
                <Label>Trial-Tage</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.trial_days}
                  onChange={(e) => setFormData({...formData, trial_days: e.target.value})}
                />
              </div>
            )}

            {/* Auto Renew */}
            <div className="flex items-center gap-2">
              <Checkbox
                checked={formData.auto_renew}
                onCheckedChange={(checked) => setFormData({...formData, auto_renew: checked})}
              />
              <Label>Automatische Verlängerung</Label>
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
                {editingSubscription ? 'Aktualisieren' : 'Erstellen'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}