import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MaintenanceRoutePlanner from '@/components/finance/MaintenanceRoutePlanner';
import SEPAMandateManager from '@/components/finance/SEPAMandateManager';
import PropertyBudgetPlanner from '@/components/finance/PropertyBudgetPlanner';
import ReserveManager from '@/components/finance/ReserveManager';
import LoanTracker from '@/components/finance/LoanTracker';

export default function FinanceManagementHub() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: building } = useQuery({
    queryKey: ['building', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const buildings = await base44.asServiceRole.entities.Building.filter({
        created_by: user.email
      }, '-created_date', 1);
      return buildings[0];
    },
    enabled: !!user?.email
  });

  const companyId = building?.company_id || user?.company_id;

  if (!companyId) return <div className="text-center py-12">Lade Daten...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Finanzverwaltung</h1>
        <p className="text-slate-600 mt-1">
          Budget, Rücklagen, Kredite & SEPA
        </p>
      </div>

      <Tabs defaultValue="budget" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="reserves">Rücklagen</TabsTrigger>
          <TabsTrigger value="loans">Kredite</TabsTrigger>
          <TabsTrigger value="sepa">SEPA</TabsTrigger>
          <TabsTrigger value="routes">Touren</TabsTrigger>
        </TabsList>

        <TabsContent value="budget">
          <PropertyBudgetPlanner companyId={companyId} />
        </TabsContent>

        <TabsContent value="reserves">
          <ReserveManager companyId={companyId} />
        </TabsContent>

        <TabsContent value="loans">
          <LoanTracker companyId={companyId} />
        </TabsContent>

        <TabsContent value="sepa">
          <SEPAMandateManager companyId={companyId} />
        </TabsContent>

        <TabsContent value="routes">
          <MaintenanceRoutePlanner companyId={companyId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}