import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RentOptimizationPanel from '@/components/ai/RentOptimizationPanel';
import PredictiveMaintenancePanel from '@/components/ai/PredictiveMaintenancePanel';
import DigitalKeyManager from '@/components/smarthome/DigitalKeyManager';
import ServiceProviderDirectory from '@/components/marketplace/ServiceProviderDirectory';

export default function SmartPropertyHub() {
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
        <h1 className="text-3xl font-bold">Smart Property Management</h1>
        <p className="text-slate-600 mt-1">
          KI-gestützte Optimierung, Predictive Maintenance & Smart Home Integration
        </p>
      </div>

      <Tabs defaultValue="rent-ai" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="rent-ai">KI-Miete</TabsTrigger>
          <TabsTrigger value="predictive">Predictive</TabsTrigger>
          <TabsTrigger value="keys">Schlüssel</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
        </TabsList>

        <TabsContent value="rent-ai">
          <RentOptimizationPanel companyId={companyId} />
        </TabsContent>

        <TabsContent value="predictive">
          <PredictiveMaintenancePanel companyId={companyId} />
        </TabsContent>

        <TabsContent value="keys">
          <DigitalKeyManager companyId={companyId} />
        </TabsContent>

        <TabsContent value="marketplace">
          <ServiceProviderDirectory companyId={companyId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}