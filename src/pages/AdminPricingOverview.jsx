import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Package, 
  Layers, 
  Settings, 
  Tags, 
  Gauge, 
  Users,
  Grid,
  Play,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminPricingOverview() {
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list()
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['featureGroups'],
    queryFn: () => base44.entities.FeatureGroup.list()
  });

  const { data: features = [] } = useQuery({
    queryKey: ['features'],
    queryFn: () => base44.entities.Feature.list()
  });

  const { data: tiers = [] } = useQuery({
    queryKey: ['pricingTiers'],
    queryFn: () => base44.entities.PricingTier.list()
  });

  const { data: limits = [] } = useQuery({
    queryKey: ['usageLimits'],
    queryFn: () => base44.entities.UsageLimit.list()
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['userSubscriptions'],
    queryFn: () => base44.entities.UserSubscription.list()
  });

  const handleSeedTiers = async () => {
    try {
      const response = await base44.functions.invoke('seedExampleTiers');
      if (response.data.success) {
        toast.success(`Erfolgreich: ${response.data.tiers} Tarife, ${response.data.tier_limits} Limits, ${response.data.tier_features} Features erstellt`);
        window.location.reload();
      }
    } catch (error) {
      toast.error('Fehler beim Seeden: ' + error.message);
    }
  };

  const handleSyncLimits = async () => {
    try {
      const response = await base44.functions.invoke('syncAllUserLimits');
      if (response.data.success) {
        toast.success(`${response.data.limits_updated} Limits synchronisiert`);
      }
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    }
  };

  const quickLinks = [
    { title: 'Produkte', icon: Package, page: 'AdminPricingProducts', count: products.length },
    { title: 'Feature-Gruppen', icon: Layers, page: 'AdminPricingFeatureGroups', count: groups.length },
    { title: 'Features', icon: Tags, page: 'AdminPricingFeatures', count: features.length },
    { title: 'Tarife', icon: Settings, page: 'AdminPricingTiers', count: tiers.length },
    { title: 'Limits', icon: Gauge, page: 'AdminLimitsConfig', count: limits.length },
    { title: 'Subscriptions', icon: Users, page: 'AdminUserSubscriptions', count: subscriptions.length },
    { title: 'Pricing-Matrix', icon: Grid, page: 'AdminPricingMatrix', count: 0 },
    { title: 'Bundles', icon: Package, page: 'AdminPricingBundles', count: 0 },
  ];

  const activeProducts = products.filter(p => p.is_active).length;
  const activeFeatures = features.filter(f => f.is_active).length;
  const activeTiers = tiers.filter(t => t.is_active).length;
  const activeSubscriptions = subscriptions.filter(s => s.status === 'ACTIVE' || s.status === 'TRIAL').length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-light text-slate-900">Pricing-Konfigurator</h1>
        <p className="text-sm text-slate-600">Zentrale Verwaltung des Subscription-Systems</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-light text-slate-900">{activeProducts}</div>
              <div className="text-sm text-slate-600">Aktive Produkte</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-light text-slate-900">{activeTiers}</div>
              <div className="text-sm text-slate-600">Aktive Tarife</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-light text-slate-900">{activeFeatures}</div>
              <div className="text-sm text-slate-600">Aktive Features</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-light text-green-600">{activeSubscriptions}</div>
              <div className="text-sm text-slate-600">Aktive Abos</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Setup & Verwaltung</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {tiers.length === 0 && (
            <Button onClick={handleSeedTiers} className="w-full justify-start">
              <Play className="h-4 w-4 mr-2" />
              Beispiel-Tarife erstellen (FREE, STARTER, PRO)
            </Button>
          )}
          {subscriptions.length > 0 && (
            <Button onClick={handleSyncLimits} variant="outline" className="w-full justify-start">
              <CheckCircle className="h-4 w-4 mr-2" />
              User-Limits synchronisieren
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Navigation Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickLinks.map(link => {
          const Icon = link.icon;
          
          return (
            <Link key={link.page} to={createPageUrl(link.page)}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Icon className="h-8 w-8 text-slate-400" />
                      {link.count > 0 && (
                        <span className="text-2xl font-light text-slate-900">{link.count}</span>
                      )}
                    </div>
                    <div className="text-sm font-medium text-slate-700">{link.title}</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}