import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VfProgress } from '@/components/shared/VfProgress';
import { Building2, Home, FileText, Users } from 'lucide-react';

export default function UsageAnalyticsWidget() {
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const subs = await base44.entities.UserSubscription.filter({ user_email: user.email });
      return subs[0];
    },
    enabled: !!user
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: () => base44.entities.Unit.list()
  });

  const { data: plan } = useQuery({
    queryKey: ['plan', subscription?.plan_id],
    queryFn: () => base44.entities.SubscriptionPlan.get(subscription.plan_id),
    enabled: !!subscription?.plan_id
  });

  if (!plan) return null;

  const limits = {
    buildings: plan.max_buildings === -1 ? 'Unbegrenzt' : plan.max_buildings,
    units: plan.max_units === -1 ? 'Unbegrenzt' : plan.max_units
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nutzungsübersicht</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-[var(--theme-text-muted)]" />
              <span>Objekte</span>
            </div>
            <span className="font-semibold text-sm">
              {buildings.length} / {limits.buildings}
            </span>
          </div>
          {plan.max_buildings !== -1 && (
            <VfProgress 
              value={buildings.length} 
              max={plan.max_buildings}
              variant={buildings.length >= plan.max_buildings ? 'error' : 'gradient'}
            />
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm">
              <Home className="h-4 w-4 text-[var(--theme-text-muted)]" />
              <span>Einheiten</span>
            </div>
            <span className="font-semibold text-sm">
              {units.length} / {limits.units}
            </span>
          </div>
          {plan.max_units !== -1 && (
            <VfProgress 
              value={units.length} 
              max={plan.max_units}
              variant={units.length >= plan.max_units ? 'error' : 'gradient'}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}