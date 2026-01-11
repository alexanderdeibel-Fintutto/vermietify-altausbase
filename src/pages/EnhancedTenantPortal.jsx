import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Home, FileText, Wrench, Euro, MessageSquare, Bot } from 'lucide-react';
import EnhancedContractView from '@/components/tenant-portal/EnhancedContractView';
import EnhancedDocumentAccess from '@/components/tenant-portal/EnhancedDocumentAccess';
import EnhancedMaintenancePortal from '@/components/tenant-portal/EnhancedMaintenancePortal';
import EnhancedPaymentPortal from '@/components/tenant-portal/EnhancedPaymentPortal';
import EnhancedCommunicationPortal from '@/components/tenant-portal/EnhancedCommunicationPortal';
import TenantAIChatbot from '@/components/tenant-portal/TenantAIChatbot';

export default function EnhancedTenantPortal() {
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

  const { data: unit } = useQuery({
    queryKey: ['tenant-unit', contract?.unit_id],
    queryFn: async () => {
      if (!contract?.unit_id) return null;
      return await base44.entities.Unit.read(contract.unit_id);
    },
    enabled: !!contract?.unit_id
  });

  if (!tenant) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="max-w-md">
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
    <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-6">
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-xl p-6 shadow-lg">
        <h1 className="text-2xl lg:text-3xl font-bold">
          Willkommen, {tenant.first_name}!
        </h1>
        <p className="text-slate-300 mt-1">
          {unit?.unit_number && `Wohnung ${unit.unit_number}`}
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 gap-2">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Übersicht</span>
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
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Nachrichten</span>
          </TabsTrigger>
          <TabsTrigger value="assistant" className="flex items-center gap-2">
            <Bot className="w-4 h-4" />
            <span className="hidden sm:inline">KI-Assistent</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <EnhancedContractView tenantId={tenant.id} contractId={contract?.id} unitId={unit?.id} />
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <EnhancedDocumentAccess tenantId={tenant.id} contractId={contract?.id} buildingId={unit?.building_id} />
        </TabsContent>

        <TabsContent value="maintenance" className="mt-6">
          <EnhancedMaintenancePortal 
            tenantId={tenant.id} 
            buildingId={unit?.building_id}
            companyId={tenant.company_id}
          />
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <EnhancedPaymentPortal tenantId={tenant.id} contractId={contract?.id} />
        </TabsContent>

        <TabsContent value="messages" className="mt-6">
          <EnhancedCommunicationPortal tenantId={tenant.id} companyId={tenant.company_id} />
        </TabsContent>

        <TabsContent value="assistant" className="mt-6">
          <TenantAIChatbot tenantId={tenant.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}