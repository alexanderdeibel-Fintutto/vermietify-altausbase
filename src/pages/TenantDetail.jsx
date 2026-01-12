import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import ContractsList from '@/components/tenant-detail/ContractsList';
import PaymentsList from '@/components/tenant-detail/PaymentsList';
import CommunicationsList from '@/components/tenant-detail/CommunicationsList';
import TenantProfileCard from '@/components/tenant-detail/TenantProfileCard';
import TenantIssuesCard from '@/components/tenant-detail/TenantIssuesCard';
import TenantDocumentsTab from '@/components/tenant-detail/TenantDocumentsTab';
import TenantContractsOverview from '@/components/tenant-detail/TenantContractsOverview';
import BankInfoSection from '@/components/tenant-detail/BankInfoSection';

export default function TenantDetail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const tenantId = searchParams.get('id');

  const { data: tenant, isLoading: tenantLoading } = useQuery({
    queryKey: ['tenant', tenantId],
    queryFn: () => base44.entities.Tenant.filter({ id: tenantId }, null, 1).then(r => r[0]),
    enabled: !!tenantId
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['tenant-contracts', tenantId],
    queryFn: () => base44.entities.LeaseContract.filter({ tenant_id: tenantId }),
    enabled: !!tenantId
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['tenant-payments', tenantId],
    queryFn: () => base44.entities.Payment.filter({ tenant_id: tenantId }, '-created_date'),
    enabled: !!tenantId
  });

  const { data: communications = [] } = useQuery({
    queryKey: ['tenant-communications', tenantId],
    queryFn: () => base44.entities.TenantCommunication.filter({ tenant_id: tenantId }, '-created_date'),
    enabled: !!tenantId
  });

  if (tenantLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Zurück
        </Button>
        <p className="text-slate-600">Mieter nicht gefunden</p>
      </div>
    );
  }

  const handleUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ['tenant', tenantId] });
  };

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
        <ArrowLeft className="w-4 h-4" />
        Zurück
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile */}
        <div className="space-y-6">
          <TenantProfileCard tenant={tenant} onUpdate={handleUpdate} />
          <BankInfoSection tenant={tenant} onUpdate={handleUpdate} />
          <TenantIssuesCard tenantId={tenantId} />
        </div>

        {/* Right Column - Details */}
        <div className="lg:col-span-2">

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="overview">Vertragsübersicht</TabsTrigger>
              <TabsTrigger value="contracts">Verträge ({contracts.length})</TabsTrigger>
              <TabsTrigger value="documents">Dokumente</TabsTrigger>
              <TabsTrigger value="payments">Zahlungen ({payments.length})</TabsTrigger>
              <TabsTrigger value="communications">Kommunikation ({communications.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <TenantContractsOverview tenantId={tenantId} />
            </TabsContent>

            <TabsContent value="contracts">
              <ContractsList contracts={contracts} />
            </TabsContent>

            <TabsContent value="documents">
              <TenantDocumentsTab tenantId={tenantId} />
            </TabsContent>

            <TabsContent value="payments">
              <PaymentsList payments={payments} />
            </TabsContent>

            <TabsContent value="communications">
              <CommunicationsList communications={communications} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}