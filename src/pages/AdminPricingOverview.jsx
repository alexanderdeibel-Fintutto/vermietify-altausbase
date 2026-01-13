import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  Package, 
  Tag, 
  Layers, 
  Shield, 
  Users, 
  TrendingUp,
  DollarSign,
  CheckCircle2,
  Settings,
  Grid3x3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

export default function AdminPricingOverview() {
  // Fetch all data
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list('sort_order', 100),
  });

  const { data: featureGroups = [] } = useQuery({
    queryKey: ['featureGroups'],
    queryFn: () => base44.entities.FeatureGroup.list('sort_order', 100),
  });

  const { data: features = [] } = useQuery({
    queryKey: ['features'],
    queryFn: () => base44.entities.Feature.list('sort_order', 500),
  });

  const { data: productFeatures = [] } = useQuery({
    queryKey: ['productFeatures'],
    queryFn: () => base44.entities.ProductFeature.list('-created_date', 1000),
  });

  const { data: tiers = [] } = useQuery({
    queryKey: ['pricingTiers'],
    queryFn: () => base44.entities.PricingTier.list('sort_order', 200),
  });

  const { data: tierFeatures = [] } = useQuery({
    queryKey: ['tierFeatures'],
    queryFn: () => base44.entities.TierFeature.list('-created_date', 1000),
  });

  const { data: usageLimits = [] } = useQuery({
    queryKey: ['usageLimits'],
    queryFn: () => base44.entities.UsageLimit.list('sort_order', 100),
  });

  const { data: tierLimits = [] } = useQuery({
    queryKey: ['tierLimits'],
    queryFn: () => base44.entities.TierLimit.list('-created_date', 500),
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['userSubscriptions'],
    queryFn: () => base44.entities.UserSubscription.list('-created_date', 500),
  });

  // Calculate stats
  const stats = {
    products: {
      total: products.length,
      active: products.filter(p => p.data.is_active).length,
      comingSoon: products.filter(p => p.data.is_coming_soon).length
    },
    features: {
      total: features.length,
      active: features.filter(f => f.data.is_active).length,
      quantifiable: features.filter(f => f.data.is_quantifiable).length
    },
    tiers: {
      total: tiers.length,
      active: tiers.filter(t => t.data.is_active).length,
      withTrial: tiers.filter(t => t.data.trial_days > 0).length
    },
    subscriptions: {
      total: subscriptions.length,
      active: subscriptions.filter(s => s.data.status === 'ACTIVE').length,
      trial: subscriptions.filter(s => s.data.status === 'TRIAL').length
    }
  };

  // Product completion stats
  const getProductCompletion = (productId) => {
    const productFeaturesCount = productFeatures.filter(
      pf => pf.data.product_id === productId
    ).length;
    
    const productTiers = tiers.filter(t => t.data.product_id === productId);
    const tiersCount = productTiers.length;
    
    // Calculate percentage (max 100)
    const featureScore = Math.min((productFeaturesCount / 5) * 50, 50); // up to 50%
    const tierScore = Math.min((tiersCount / 3) * 50, 50); // up to 50%
    
    return Math.round(featureScore + tierScore);
  };

  // Quick links
  const quickLinks = [
    {
      title: 'Produkte',
      href: 'AdminPricingProducts',
      icon: Package,
      count: stats.products.total,
      color: 'bg-blue-500'
    },
    {
      title: 'Feature-Gruppen',
      href: 'AdminPricingFeatureGroups',
      icon: Layers,
      count: featureGroups.length,
      color: 'bg-purple-500'
    },
    {
      title: 'Features',
      href: 'AdminPricingFeatures',
      icon: Tag,
      count: stats.features.total,
      color: 'bg-green-500'
    },
    {
      title: 'Tarife',
      href: 'AdminPricingTiersV2',
      icon: DollarSign,
      count: stats.tiers.total,
      color: 'bg-orange-500'
    },
    {
      title: 'Usage Limits',
      href: 'AdminLimitsConfig',
      icon: Shield,
      count: usageLimits.length,
      color: 'bg-red-500'
    },
    {
      title: 'Subscriptions',
      href: 'AdminUserSubscriptions',
      icon: Users,
      count: stats.subscriptions.total,
      color: 'bg-indigo-500'
    }
  ];

  const formatPrice = (cents) => {
    if (!cents) return '0€';
    return `${(cents / 100).toFixed(2)}€`;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-light text-slate-900 mb-2">Pricing Konfigurator</h1>
        <p className="text-slate-600">Zentrale Verwaltung für Produkte, Features und Tarife</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Produkte</p>
                <p className="text-2xl font-light">{stats.products.active}/{stats.products.total}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Features</p>
                <p className="text-2xl font-light">{stats.features.active}/{stats.features.total}</p>
              </div>
              <Tag className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Tarife</p>
                <p className="text-2xl font-light">{stats.tiers.active}/{stats.tiers.total}</p>
              </div>
              <DollarSign className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Subscriptions</p>
                <p className="text-2xl font-light text-green-600">{stats.subscriptions.active}</p>
              </div>
              <Users className="w-8 h-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="font-light">Schnellzugriff</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {quickLinks.map(link => (
              <Link key={link.href} to={createPageUrl(link.href)}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className={`${link.color} p-3 rounded-lg`}>
                        <link.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">{link.title}</p>
                        <p className="text-2xl font-light text-slate-700">{link.count}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Products Overview */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-light flex items-center gap-2">
              <Package className="w-5 h-5" />
              Produkte Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {products.map(product => {
                const completion = getProductCompletion(product.id);
                const productTiers = tiers.filter(t => t.data.product_id === product.id);
                
                return (
                  <div key={product.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{product.data.name}</span>
                        {product.data.is_active ? (
                          <Badge className="bg-green-500">Aktiv</Badge>
                        ) : product.data.is_coming_soon ? (
                          <Badge className="bg-blue-500">Bald verfügbar</Badge>
                        ) : (
                          <Badge variant="outline">Inaktiv</Badge>
                        )}
                      </div>
                      <span className="text-sm text-slate-600">{completion}%</span>
                    </div>
                    <Progress value={completion} className="h-2 mb-2" />
                    <div className="flex gap-4 text-xs text-slate-600">
                      <span>{productTiers.length} Tarife</span>
                      <span>
                        {productFeatures.filter(pf => pf.data.product_id === product.id).length} Features
                      </span>
                    </div>
                  </div>
                );
              })}

              {products.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  Keine Produkte vorhanden
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-light flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Beliebte Tarife
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tiers
                .filter(t => t.data.is_active)
                .sort((a, b) => {
                  const subsA = subscriptions.filter(s => s.data.tier_id === a.id).length;
                  const subsB = subscriptions.filter(s => s.data.tier_id === b.id).length;
                  return subsB - subsA;
                })
                .slice(0, 6)
                .map(tier => {
                  const product = products.find(p => p.id === tier.data.product_id);
                  const subCount = subscriptions.filter(s => s.data.tier_id === tier.id).length;
                  
                  return (
                    <div key={tier.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{tier.data.name}</div>
                        <div className="text-xs text-slate-500">{product?.data.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm">{formatPrice(tier.data.price_monthly)}/mo</div>
                        <div className="text-xs text-slate-500">{subCount} Subscriptions</div>
                      </div>
                    </div>
                  );
                })}

              {tiers.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  Keine Tarife vorhanden
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="font-light flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            System-Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="font-medium">Konfiguration</p>
              <p className="text-2xl font-light text-green-600">
                {Math.round(((stats.products.total + stats.features.total + stats.tiers.total) / 30) * 100)}%
              </p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="font-medium">Feature-Zuweisungen</p>
              <p className="text-2xl font-light text-blue-600">{tierFeatures.length}</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Shield className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="font-medium">Limit-Definitionen</p>
              <p className="text-2xl font-light text-purple-600">{tierLimits.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Actions */}
      <div className="mt-8 flex justify-center gap-4">
        <Link to={createPageUrl('AdminPricingMatrix')}>
          <Button variant="outline" size="lg">
            <Grid3x3 className="w-5 h-5 mr-2" />
            Pricing Matrix anzeigen
          </Button>
        </Link>
        <Link to={createPageUrl('AdminPricingProducts')}>
          <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">
            <Settings className="w-5 h-5 mr-2" />
            Konfigurator starten
          </Button>
        </Link>
      </div>
    </div>
  );
}