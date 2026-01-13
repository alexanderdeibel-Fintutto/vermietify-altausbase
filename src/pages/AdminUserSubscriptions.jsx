import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminUserSubscriptions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['userSubscriptions'],
    queryFn: () => base44.entities.UserSubscription.list('-created_date')
  });

  const { data: tiers = [] } = useQuery({
    queryKey: ['pricingTiers'],
    queryFn: () => base44.entities.PricingTier.list()
  });

  const getTier = (tierId) => tiers.find(t => t.id === tierId);

  const filteredSubs = subscriptions.filter(sub => {
    const matchesSearch = sub.user_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusColors = {
    TRIAL: 'bg-blue-100 text-blue-700',
    ACTIVE: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-orange-100 text-orange-700',
    EXPIRED: 'bg-red-100 text-red-700',
    SUSPENDED: 'bg-slate-100 text-slate-700'
  };

  const stats = {
    total: subscriptions.length,
    trial: subscriptions.filter(s => s.status === 'TRIAL').length,
    active: subscriptions.filter(s => s.status === 'ACTIVE').length,
    cancelled: subscriptions.filter(s => s.status === 'CANCELLED').length
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-light text-slate-900">User-Subscriptions</h1>
        <p className="text-sm text-slate-600">Übersicht aller Nutzer-Abonnements</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-light text-slate-900">{stats.total}</div>
              <div className="text-sm text-slate-600">Gesamt</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-light text-blue-600">{stats.trial}</div>
              <div className="text-sm text-slate-600">Trial</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-light text-green-600">{stats.active}</div>
              <div className="text-sm text-slate-600">Aktiv</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-light text-orange-600">{stats.cancelled}</div>
              <div className="text-sm text-slate-600">Gekündigt</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Nach E-Mail suchen..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
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
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filteredSubs.map(sub => {
          const tier = getTier(sub.tier_id);
          
          return (
            <Card key={sub.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="h-4 w-4 text-slate-400" />
                      <span className="font-medium">{sub.user_email}</span>
                      <Badge className={statusColors[sub.status]}>
                        {sub.status}
                      </Badge>
                      {tier && (
                        <Badge variant="outline">{tier.name}</Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-slate-600">Zyklus:</span>
                        <span className="ml-2 font-medium">{sub.billing_cycle}</span>
                      </div>
                      {sub.trial_end_date && (
                        <div>
                          <span className="text-slate-600">Trial bis:</span>
                          <span className="ml-2 font-medium">
                            {format(new Date(sub.trial_end_date), 'dd.MM.yyyy')}
                          </span>
                        </div>
                      )}
                      {sub.next_billing_date && (
                        <div>
                          <span className="text-slate-600">Nächste Rechnung:</span>
                          <span className="ml-2 font-medium">
                            {format(new Date(sub.next_billing_date), 'dd.MM.yyyy')}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-600">Auto-Renew:</span>
                        <span className="ml-2 font-medium">{sub.auto_renew ? '✓' : '✗'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}