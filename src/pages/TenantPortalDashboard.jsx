import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import TenantContractOverview from '@/components/tenant-portal/TenantContractOverview';
import TenantDocumentLibrary from '@/components/tenant-portal/TenantDocumentLibrary';
import TenantMaintenanceTracker from '@/components/tenant-portal/TenantMaintenanceTracker';
import TenantPaymentHistory from '@/components/tenant-portal/TenantPaymentHistory';
import TenantCommunicationHub from '@/components/tenant-portal/TenantCommunicationHub';
import { Home, FileText, Wrench, Euro, MessageSquare, Bell, Star, Users } from 'lucide-react';
import TenantNotificationCenter from '@/components/tenant-portal/TenantNotificationCenter';
import TenantFavoritesManager from '@/components/tenant-portal/TenantFavoritesManager';
import CommunityFeed from '@/components/tenant-community/CommunityFeed';
import TenantChatbot from '@/components/tenant-portal/TenantChatbot';
import TenantAnnouncementFeed from '@/components/tenant-portal/TenantAnnouncementFeed';
import TenantSurveyParticipation from '@/components/tenant-portal/TenantSurveyParticipation';

export default function TenantPortalDashboard() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: tenant } = useQuery({
    queryKey: ['tenant-data', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const tenants = await base44.entities.Tenant.filter({ email: user.email });
      return tenants[0];
    },
    enabled: !!user?.email
  });

  const { data: contract } = useQuery({
    queryKey: ['active-contract', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return null;
      const contracts = await base44.entities.LeaseContract.filter({ 
        tenant_id: tenant.id, 
        status: 'active' 
      });
      return contracts[0];
    },
    enabled: !!tenant?.id
  });

  if (!tenant) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <Home className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Willkommen im Mieterportal</h2>
            <p className="text-slate-600">Lade Ihre Daten...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mieterportal</h1>
        <p className="text-slate-600 mt-1">
          Willkommen zurück, {tenant.first_name} {tenant.last_name}
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Übersicht</span>
          </TabsTrigger>
          <TabsTrigger value="favorites" className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            <span className="hidden sm:inline">Favoriten</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Mitteilungen</span>
          </TabsTrigger>
          <TabsTrigger value="community" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Community</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Dokumente</span>
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            <span className="hidden sm:inline">Wartung</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <Euro className="w-4 h-4" />
            <span className="hidden sm:inline">Zahlungen</span>
          </TabsTrigger>
          <TabsTrigger value="communication" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Nachrichten</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <TenantContractOverview tenantId={tenant.id} />
              <TenantAnnouncementFeed tenantId={tenant.id} buildingId={contract?.unit_id} />
            </div>
            <div className="space-y-6">
              <TenantChatbot tenantId={tenant.id} companyId={tenant.company_id} />
              <TenantSurveyParticipation tenantId={tenant.id} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="favorites" className="mt-6">
          <TenantFavoritesManager tenantId={tenant.id} />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <TenantNotificationCenter tenantId={tenant.id} />
        </TabsContent>

        <TabsContent value="community" className="mt-6">
          <CommunityFeed 
            tenantId={tenant.id} 
            buildingId={contract?.unit_id ? (async () => {
              const unit = await base44.entities.Unit.read(contract.unit_id);
              return unit.building_id;
            })() : null}
            companyId={tenant.company_id}
          />
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <TenantDocumentLibrary tenantId={tenant.id} unitId={contract?.unit_id} />
        </TabsContent>

        <TabsContent value="maintenance" className="mt-6">
          <TenantMaintenanceTracker 
            tenantId={tenant.id} 
            unitId={contract?.unit_id}
            companyId={tenant.company_id}
          />
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <TenantPaymentHistory tenantId={tenant.id} contractId={contract?.id} />
        </TabsContent>

        <TabsContent value="communication" className="mt-6">
          <TenantCommunicationHub tenantId={tenant.id} companyId={tenant.company_id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}