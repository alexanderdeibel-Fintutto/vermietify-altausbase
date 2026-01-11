import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DepositManager from '@/components/tenant-management/DepositManager';
import UtilitySettlementManager from '@/components/tenant-management/UtilitySettlementManager';
import RentIncreaseAssistant from '@/components/tenant-management/RentIncreaseAssistant';

export default function TenantManagementHub() {
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
        <h1 className="text-3xl font-bold">Mietermanagement</h1>
        <p className="text-slate-600 mt-1">
          Kaution, Nebenkostenabrechnungen & Mieterhöhungen
        </p>
      </div>

      <Tabs defaultValue="deposits" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="deposits">Kautionen</TabsTrigger>
          <TabsTrigger value="utilities">Nebenkosten</TabsTrigger>
          <TabsTrigger value="increases">Mieterhöhungen</TabsTrigger>
        </TabsList>

        <TabsContent value="deposits">
          <DepositManager companyId={companyId} />
        </TabsContent>

        <TabsContent value="utilities">
          <UtilitySettlementManager companyId={companyId} />
        </TabsContent>

        <TabsContent value="increases">
          <RentIncreaseAssistant companyId={companyId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}