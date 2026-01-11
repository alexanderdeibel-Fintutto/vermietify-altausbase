import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SmartHomeControl from '@/components/smarthome/SmartHomeControl';
import ARViewingLauncher from '@/components/tenant-app/ARViewingLauncher';

export default function SmartHomeHub() {
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
        <h1 className="text-3xl font-bold">Smart Home & AR</h1>
        <p className="text-slate-600 mt-1">
          Heizungssteuerung, Zugangsmanagement, Smart Meter & AR-Besichtigungen
        </p>
      </div>

      <Tabs defaultValue="devices" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="devices">Smart Devices</TabsTrigger>
          <TabsTrigger value="ar">AR-Besichtigungen</TabsTrigger>
        </TabsList>

        <TabsContent value="devices">
          <SmartHomeControl companyId={companyId} />
        </TabsContent>

        <TabsContent value="ar">
          <ARViewingLauncher companyId={companyId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}