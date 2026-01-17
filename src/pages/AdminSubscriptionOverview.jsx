import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { VfDashboard, VfKpiCard, VfDashboardWidget } from '@/components/dashboards/VfDashboard';
import { Users, CreditCard, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function AdminSubscriptionOverview() {
  const { data: subscriptions = [] } = useQuery({
    queryKey: ['all-subscriptions'],
    queryFn: () => base44.entities.UserSubscription.list()
  });

  const activeSubscriptions = subscriptions.filter(s => s.status === 'ACTIVE').length;
  const trialSubscriptions = subscriptions.filter(s => s.status === 'TRIAL').length;
  const cancelledSubscriptions = subscriptions.filter(s => s.status === 'CANCELLED').length;

  const mrr = subscriptions
    .filter(s => s.status === 'ACTIVE' && s.billing_cycle === 'MONTHLY')
    .reduce((sum, s) => {
      // Would need to join with plan to get actual price
      return sum + 29; // Placeholder
    }, 0);

  const planDistribution = subscriptions.reduce((acc, sub) => {
    acc[sub.plan_id] = (acc[sub.plan_id] || 0) + 1;
    return acc;
  }, {});

  return (
    <VfDashboard
      greeting="Abo-Verwaltung 💳"
      date="Subscription Overview"
      kpis={[
        {
          label: 'Aktive Abos',
          value: activeSubscriptions,
          trend: 'up',
          trendValue: `${trialSubscriptions} in Trial`,
          icon: Users,
          highlighted: true
        },
        {
          label: 'MRR',
          value: `€${mrr.toLocaleString('de-DE')}`,
          trend: 'up',
          trendValue: '↑ 12,5%',
          icon: CreditCard
        },
        {
          label: 'Churn Rate',
          value: '2,3%',
          trend: cancelledSubscriptions > 5 ? 'warning' : 'up',
          icon: TrendingUp
        },
        {
          label: 'Gekündigt',
          value: cancelledSubscriptions,
          trend: 'warning',
          icon: AlertCircle
        }
      ]}
    >
      <div className="vf-dashboard__grid">
        <VfDashboardWidget
          title="Aktive Subscriptions"
          footer={
            <button className="text-sm text-[var(--theme-primary)] hover:underline">
              Alle anzeigen →
            </button>
          }
        >
          {subscriptions.slice(0, 8).map((sub) => (
            <Card key={sub.id} className="mb-2">
              <CardContent className="p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{sub.user_email}</div>
                    <div className="text-sm text-[var(--theme-text-muted)]">
                      {sub.billing_cycle}
                    </div>
                  </div>
                  <span className={
                    sub.status === 'ACTIVE' ? 'vf-badge vf-badge-success' :
                    sub.status === 'TRIAL' ? 'vf-badge vf-badge-warning' :
                    'vf-badge vf-badge-default'
                  }>
                    {sub.status}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </VfDashboardWidget>

        <VfDashboardWidget title="Plan-Verteilung">
          <div className="space-y-3">
            {Object.entries(planDistribution).map(([planId, count]) => (
              <div key={planId} className="flex justify-between items-center">
                <span className="text-sm">Plan {planId.substring(0, 8)}</span>
                <span className="font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </VfDashboardWidget>
      </div>
    </VfDashboard>
  );
}