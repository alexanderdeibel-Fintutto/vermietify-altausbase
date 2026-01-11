import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ApplicantManager from '@/components/property-management/ApplicantManager';
import ViewingScheduler from '@/components/property-management/ViewingScheduler';
import VacancyForecast from '@/components/property-management/VacancyForecast';

export default function PropertyManagementHub() {
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
        <h1 className="text-3xl font-bold">Objektverwaltung</h1>
        <p className="text-slate-600 mt-1">
          Leerstand, Bewerber & Besichtigungen
        </p>
      </div>

      <Tabs defaultValue="vacancy" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="vacancy">Leerstand</TabsTrigger>
          <TabsTrigger value="applicants">Bewerber</TabsTrigger>
          <TabsTrigger value="viewings">Besichtigungen</TabsTrigger>
        </TabsList>

        <TabsContent value="vacancy">
          <VacancyForecast companyId={companyId} />
        </TabsContent>

        <TabsContent value="applicants">
          <ApplicantManager companyId={companyId} />
        </TabsContent>

        <TabsContent value="viewings">
          <ViewingScheduler companyId={companyId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}