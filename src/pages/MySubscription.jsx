import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import UsageSummary from '@/components/subscription/UsageSummary';
import TrialCountdown from '@/components/subscription/TrialCountdown';
import PlanComparisonCard from '@/components/subscription/PlanComparisonCard';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';

export default function MySubscription() {
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Mein Abonnement"
        subtitle="Verwalten Sie Ihren Plan und die Nutzung"
        actions={
          <Button variant="gradient">
            <Zap className="h-4 w-4 mr-2" />
            Upgrade
          </Button>
        }
      />

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <UsageSummary />
        <TrialCountdown endDate="2026-02-18" />
      </div>

      <PlanComparisonCard />
    </div>
  );
}