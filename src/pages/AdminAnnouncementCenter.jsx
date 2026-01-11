import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AnnouncementManager from '@/components/admin/AnnouncementManager';
import TenantSurveyManager from '@/components/admin/TenantSurveyManager';
import { Megaphone, BarChart3 } from 'lucide-react';

export default function AdminAnnouncementCenter() {
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
        <h1 className="text-3xl font-bold">Mieterkommunikation</h1>
        <p className="text-slate-600 mt-1">Ankündigungen & Umfragen verwalten</p>
      </div>

      <Tabs defaultValue="announcements" className="w-full">
        <TabsList>
          <TabsTrigger value="announcements" className="flex items-center gap-2">
            <Megaphone className="w-4 h-4" />
            Ankündigungen
          </TabsTrigger>
          <TabsTrigger value="surveys" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Umfragen
          </TabsTrigger>
        </TabsList>

        <TabsContent value="announcements">
          <AnnouncementManager companyId={companyId} />
        </TabsContent>

        <TabsContent value="surveys">
          <TenantSurveyManager companyId={companyId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}