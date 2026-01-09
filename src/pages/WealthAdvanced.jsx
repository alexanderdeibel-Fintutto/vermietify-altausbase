import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PortfolioRebalancingPanel from '@/components/wealth/PortfolioRebalancingPanel';
import PortfolioSimulationPanel from '@/components/wealth/PortfolioSimulationPanel';
import AnalyticsPanel from '@/components/wealth/AnalyticsPanel';
import SystemHealthDashboard from '@/components/wealth/SystemHealthDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function WealthAdvancedPage() {
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: portfolio = [] } = useQuery({
    queryKey: ['assetPortfolio', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const results = await base44.entities.AssetPortfolio.filter(
        { user_id: currentUser.id, status: 'active' },
        '-created_date'
      );
      return results || [];
    },
    enabled: !!currentUser?.id
  });

  const totalValue = portfolio.reduce((sum, a) => sum + (a.quantity * a.current_value), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-light text-slate-900">Advanced Analytics</h1>
        <p className="text-sm font-light text-slate-600 mt-1">
          Rebalancing, Simulationen und Systemstatistiken
        </p>
      </div>

      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="analytics">Analysen</TabsTrigger>
          <TabsTrigger value="rebalancing">Rebalancing</TabsTrigger>
          <TabsTrigger value="simulation">Simulation</TabsTrigger>
          <TabsTrigger value="health">System</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          <AnalyticsPanel portfolio={portfolio} />
        </TabsContent>

        <TabsContent value="rebalancing">
          <PortfolioRebalancingPanel portfolio={portfolio} userId={currentUser?.id} />
        </TabsContent>

        <TabsContent value="simulation">
          <PortfolioSimulationPanel userId={currentUser?.id} totalValue={totalValue} />
        </TabsContent>

        <TabsContent value="health">
          <SystemHealthDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}