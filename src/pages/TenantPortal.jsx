import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Bot } from 'lucide-react';
import LeaseDetailsCard from '@/components/tenant-portal/LeaseDetailsCard';
import PaymentHistoryWidget from '@/components/tenant-portal/PaymentHistoryWidget';
import MaintenanceRequestForm from '@/components/tenant-portal/MaintenanceRequestForm';
import MaintenanceRequestList from '@/components/tenant-portal/MaintenanceRequestList';
import MaintenanceRequestTracker from '@/components/tenant-portal/MaintenanceRequestTracker';
import KnowledgeBaseWidget from '@/components/tenant-portal/KnowledgeBaseWidget';
import PaymentForm from '@/components/tenant-portal/PaymentForm';
import PaymentReceiptViewer from '@/components/tenant-portal/PaymentReceiptViewer';
import EnhancedTenantChat from '@/components/tenant-portal/EnhancedTenantChat';
import TenantDocumentUpload from '@/components/tenant-portal/TenantDocumentUpload';
import UpcomingMaintenanceView from '@/components/tenant-portal/UpcomingMaintenanceView';
import TenantPaymentManagement from '@/components/tenant-portal/TenantPaymentManagement';
import KnowledgeBaseViewer from '@/components/tenant-portal/KnowledgeBaseViewer';
import TenantIssueReporter from '@/components/tenant-portal/TenantIssueReporter';
import ContractDocumentsWidget from '@/components/tenant-portal/ContractDocumentsWidget';
import TenantPortalQuickActions from '@/components/tenant-portal/TenantPortalQuickActions';
import RecentIssuesWidget from '@/components/tenant-portal/RecentIssuesWidget';
import TenantAIChatbot from '@/components/tenant-portal/TenantAIChatbot';

export default function TenantPortal() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showChatbot, setShowChatbot] = useState(false);

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

  const { data: contract } = useQuery({
    queryKey: ['tenant-contract', tenantRecord?.id],
    queryFn: async () => {
      const contracts = await base44.entities.LeaseContract.filter({ 
        tenant_id: tenantRecord.id,
        status: 'active'
      });
      return contracts[0];
    },
    enabled: !!tenantRecord
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-slate-900">Mieterportal</h1>
          <p className="text-sm font-light text-slate-600 mt-1">
            Verwalten Sie Ihren Mietvertrag, Zahlungen und Wartungsanfragen
          </p>
        </div>
        <Button 
          onClick={() => setShowChatbot(!showChatbot)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Bot className="w-5 h-5 mr-2" />
          KI-Assistent {showChatbot ? 'schließen' : 'öffnen'}
        </Button>
      </div>

      {showChatbot && (
        <TenantAIChatbot 
          tenantId={tenantRecord?.id} 
          onClose={() => setShowChatbot(false)}
        />
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="overview" className="font-light text-xs">
            Übersicht
          </TabsTrigger>
          <TabsTrigger value="payments" className="font-light text-xs">
            Zahlungen
          </TabsTrigger>
          <TabsTrigger value="documents" className="font-light text-xs">
            Dokumente
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
          <TenantPortalQuickActions onTabChange={setActiveTab} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LeaseDetailsCard tenantId={tenantRecord?.id} />
            <PaymentHistoryWidget tenantId={tenantRecord?.id} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ContractDocumentsWidget contractId={contract?.id} />
            <RecentIssuesWidget tenantId={tenantRecord?.id} />
          </div>
          <UpcomingMaintenanceView unitId={tenantRecord?.unit_id} />
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <TenantPaymentManagement 
            tenantId={tenantRecord?.id} 
            contractId={contract?.id}
          />
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <TenantDocumentUpload 
            tenantId={tenantRecord?.id}
            contractId={contract?.id}
          />
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          <TenantIssueReporter 
            tenantId={tenantRecord?.id}
            unitId={tenantRecord?.unit_id}
            buildingId={tenantRecord?.building_id}
          />
          <MaintenanceRequestTracker />
        </TabsContent>

        <TabsContent value="messages">
          <EnhancedTenantChat />
        </TabsContent>

        <TabsContent value="help">
          <KnowledgeBaseViewer />
        </TabsContent>
      </Tabs>
    </div>
  );
}