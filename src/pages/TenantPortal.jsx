import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import LeaseDetailsCard from '@/components/tenant-portal/LeaseDetailsCard';
import PaymentHistoryWidget from '@/components/tenant-portal/PaymentHistoryWidget';
import MaintenanceRequestForm from '@/components/tenant-portal/MaintenanceRequestForm';
import MaintenanceRequestList from '@/components/tenant-portal/MaintenanceRequestList';
import MaintenanceRequestTracker from '@/components/tenant-portal/MaintenanceRequestTracker';
import KnowledgeBaseWidget from '@/components/tenant-portal/KnowledgeBaseWidget';
import PaymentForm from '@/components/tenant-portal/PaymentForm';
import PaymentReceiptViewer from '@/components/tenant-portal/PaymentReceiptViewer';

export default function TenantPortal() {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: tenantRecord } = useQuery({
    queryKey: ['tenant', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return null;
      const results = await base44.entities.Tenant.filter(
        { email: currentUser.email },
        '-created_date',
        1
      );
      return results[0];
    },
    enabled: !!currentUser?.email,
  });

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 max-w-md">
          <AlertCircle className="w-8 h-8 text-red-500 mb-4" />
          <h2 className="text-xl font-light text-slate-900">Nicht authentifiziert</h2>
          <p className="text-sm font-light text-slate-600 mt-2">
            Bitte melden Sie sich an, um auf das Mieterportal zuzugreifen.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-light text-slate-900">Mieterportal</h1>
        <p className="text-sm font-light text-slate-600 mt-1">
          Verwalten Sie Ihren Mietvertrag, Zahlungen und Wartungsanfragen
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-4">
          <TabsTrigger value="overview" className="font-light text-xs">
            Übersicht
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="font-light text-xs">
            Wartung
          </TabsTrigger>
          <TabsTrigger value="messages" className="font-light text-xs">
            Nachrichten
          </TabsTrigger>
          <TabsTrigger value="help" className="font-light text-xs">
            Hilfe
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LeaseDetailsCard tenantId={tenantRecord?.id} />
            <PaymentHistoryWidget tenantId={tenantRecord?.id} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PaymentForm tenantId={tenantRecord?.id} pendingInvoices={[]} />
            <PaymentReceiptViewer tenantId={tenantRecord?.id} />
          </div>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          <MaintenanceRequestForm tenantId={tenantRecord?.id} unitId={tenantRecord?.unit_id} />
          <MaintenanceRequestList tenantId={tenantRecord?.id} />
        </TabsContent>

        <TabsContent value="messages">
          <Card className="p-6">
            <h2 className="text-lg font-light text-slate-900 mb-4">Direkte Nachricht an Administrator</h2>
            <p className="text-sm font-light text-slate-600">
              Nutzen Sie das Mieterkommunikationszentrum, um mit dem Verwaltungsteam zu kommunizieren.
            </p>
            <a href="/TenantCommunication" className="inline-block mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-light hover:bg-slate-800">
              Zum Nachrichtenzentrum
            </a>
          </Card>
        </TabsContent>

        <TabsContent value="help">
          <KnowledgeBaseWidget />
        </TabsContent>
      </Tabs>
    </div>
  );
}