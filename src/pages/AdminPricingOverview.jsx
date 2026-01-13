import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Layers, Zap, Users, Gauge, DollarSign, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export default function AdminPricingOverview() {
  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list()
  });

  const { data: tiers = [] } = useQuery({
    queryKey: ['pricingTiers'],
    queryFn: () => base44.entities.PricingTier.list()
  });

  const { data: features = [] } = useQuery({
    queryKey: ['features'],
    queryFn: () => base44.entities.Feature.list()
  });

  const { data: limits = [] } = useQuery({
    queryKey: ['usageLimits'],
    queryFn: () => base44.entities.UsageLimit.list()
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['userSubscriptions'],
    queryFn: () => base44.entities.UserSubscription.list()
  });

  const { data: bundles = [] } = useQuery({
    queryKey: ['productBundles'],
    queryFn: () => base44.entities.ProductBundle.list()
  });

  const seedMutation = useMutation({
    mutationFn: () => base44.functions.invoke('admin/seedExampleTiers'),
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success('Beispiel-Daten erfolgreich erstellt');
    },
    onError: (error) => {
      toast.error('Fehler beim Erstellen: ' + error.message);
    }
  });

  const stats = [
    { 
      title: 'Produkte', 
      value: products.length, 
      icon: Package, 
      color: 'text-blue-600',
      link: 'AdminPricingProducts'
    },
    { 
      title: 'Tarife', 
      value: tiers.length, 
      icon: Layers, 
      color: 'text-purple-600',
      link: 'AdminPricingTiers'
    },
    { 
      title: 'Features', 
      value: features.length, 
      icon: Zap, 
      color: 'text-yellow-600',
      link: 'AdminPricingFeatures'
    },
    { 
      title: 'Limits', 
      value: limits.length, 
      icon: Gauge, 
      color: 'text-red-600',
      link: 'AdminLimitsConfig'
    },
    { 
      title: 'Bundles', 
      value: bundles.length, 
      icon: DollarSign, 
      color: 'text-green-600',
      link: 'AdminPricingBundles'
    },
    { 
      title: 'Abonnements', 
      value: subscriptions.length, 
      icon: Users, 
      color: 'text-indigo-600',
      link: 'AdminUserSubscriptions'
    },
  ];

  const activeSubscriptions = subscriptions.filter(s => s.status === 'ACTIVE').length;
  const trialSubscriptions = subscriptions.filter(s => s.status === 'TRIAL').length;
  const revenue = subscriptions
    .filter(s => s.status === 'ACTIVE')
    .reduce((sum, sub) => {
      const tier = tiers.find(t => t.id === sub.tier_id);
      if (!tier) return sum;
      return sum + (sub.billing_cycle === 'YEARLY' ? tier.price_yearly : tier.price_monthly);
    }, 0);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-slate-900">Pricing-System</h1>
          <p className="text-slate-600 mt-2">Zentrale Verwaltung von Preisen, Features und Limits</p>
        </div>
        <Button 
          onClick={() => seedMutation.mutate()}
          disabled={seedMutation.isPending}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {seedMutation.isPending ? 'Erstelle...' : 'Beispiel-Daten erstellen'}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} to={createPageUrl(stat.link)}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">{stat.title}</p>
                      <p className="text-3xl font-light text-slate-900">{stat.value}</p>
                    </div>
                    <Icon className={`h-10 w-10 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Revenue Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-light">Abonnement-Übersicht</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-sm text-slate-600 mb-2">Aktive Abos</p>
              <p className="text-3xl font-light text-green-600">{activeSubscriptions}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-600 mb-2">Trial-Abos</p>
              <p className="text-3xl font-light text-yellow-600">{trialSubscriptions}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-600 mb-2">MRR (geschätzt)</p>
              <p className="text-3xl font-light text-blue-600">{(revenue / 100).toFixed(2)}€</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to={createPageUrl('AdminPricingProducts')}>
          <Button variant="outline" className="w-full">
            <Package className="h-4 w-4 mr-2" />
            Produkte
          </Button>
        </Link>
        <Link to={createPageUrl('AdminPricingFeatureGroups')}>
          <Button variant="outline" className="w-full">
            <Layers className="h-4 w-4 mr-2" />
            Feature-Gruppen
          </Button>
        </Link>
        <Link to={createPageUrl('AdminPricingFeatures')}>
          <Button variant="outline" className="w-full">
            <Zap className="h-4 w-4 mr-2" />
            Features
          </Button>
        </Link>
        <Link to={createPageUrl('AdminPricingTiers')}>
          <Button variant="outline" className="w-full">
            <Layers className="h-4 w-4 mr-2" />
            Tarife
          </Button>
        </Link>
        <Link to={createPageUrl('AdminLimitsConfig')}>
          <Button variant="outline" className="w-full">
            <Gauge className="h-4 w-4 mr-2" />
            Limits
          </Button>
        </Link>
        <Link to={createPageUrl('AdminPricingBundles')}>
          <Button variant="outline" className="w-full">
            <DollarSign className="h-4 w-4 mr-2" />
            Bundles
          </Button>
        </Link>
        <Link to={createPageUrl('AdminUserSubscriptions')}>
          <Button variant="outline" className="w-full">
            <Users className="h-4 w-4 mr-2" />
            User-Subscriptions
          </Button>
        </Link>
        <Link to={createPageUrl('AdminPricingMatrix')}>
          <Button variant="outline" className="w-full">
            Matrix-Ansicht
          </Button>
        </Link>
      </div>

      {/* Active Products */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-light">Aktive Produkte</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {products.filter(p => p.is_active).map(product => {
              const productTiers = tiers.filter(t => t.product_id === product.id);
              return (
                <div 
                  key={product.id} 
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-medium"
                      style={{ backgroundColor: product.color }}
                    >
                      {product.product_code.substring(0, 2)}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{product.name}</div>
                      <div className="text-sm text-slate-600">{product.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline">{productTiers.length} Tarife</Badge>
                    <Badge 
                      className={
                        product.category === 'CORE' ? 'bg-blue-100 text-blue-800' :
                        product.category === 'ADD_ON' ? 'bg-purple-100 text-purple-800' :
                        'bg-slate-100 text-slate-800'
                      }
                    >
                      {product.category}
                    </Badge>
                  </div>
                </div>
              );
            })}
            {products.filter(p => p.is_active).length === 0 && (
              <p className="text-center text-slate-500 py-8">
                Keine aktiven Produkte. Erstellen Sie zuerst Beispiel-Daten.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}