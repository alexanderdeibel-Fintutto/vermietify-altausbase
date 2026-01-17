import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import UsageMeter from './UsageMeter';
import { TrendingUp } from 'lucide-react';

export default function UsageSummary() {
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

  const { data: plan } = useQuery({
    queryKey: ['plan', subscription?.plan_id],
    queryFn: () => base44.entities.SubscriptionPlan.get(subscription.plan_id),
    enabled: !!subscription?.plan_id
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: () => base44.entities.Unit.list()
  });

  if (!plan) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Nutzung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <UsageMeter
          current={buildings.length}
          max={plan.max_buildings}
          label="Objekte"
        />

        <UsageMeter
          current={units.length}
          max={plan.max_units}
          label="Einheiten"
        />
      </CardContent>
    </Card>
  );
}