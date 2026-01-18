import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useSearchParams, Link } from 'react-router-dom';
import { Users, FileText, Euro, MessageCircle, ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TenantProfileCard from '@/components/tenant-detail/TenantProfileCard';
import TenantContractsOverview from '@/components/tenant-detail/TenantContractsOverview';
import PaymentsList from '@/components/tenant-detail/PaymentsList';
import TenantDocumentsTab from '@/components/tenant-detail/TenantDocumentsTab';
import CommunicationsList from '@/components/tenant-detail/CommunicationsList';
import TenantScoring from '@/components/tenants/TenantScoring';

export default function TenantDetailEnhanced() {
  const [searchParams] = useSearchParams();
  const tenantId = searchParams.get('id');
  const [activeTab, setActiveTab] = useState('overview');

  const { data: tenant } = useQuery({
    queryKey: ['tenant', tenantId],
    queryFn: () => base44.entities.Tenant.get(tenantId),
    enabled: !!tenantId
  });

  if (!tenant) return <div>Laden...</div>;

  return (
    <div className="min-h-screen bg-[var(--theme-background)]">
      <div className="vf-detail-header">
        <Link to="/tenants" className="vf-detail-header__back">
          <ArrowLeft className="h-4 w-4" />
          Zurück zu Mietern
        </Link>

        <div className="vf-detail-header__top">
          <div className="flex items-start gap-4 flex-1">
            <div className="vf-detail-header__icon">
              <Users className="h-7 w-7" />
            </div>
            <div className="vf-detail-header__info">
              <h1 className="vf-detail-header__title">{tenant.name}</h1>
              <p className="vf-detail-header__subtitle">
                Mieter seit {tenant.created_date ? new Date(tenant.created_date).toLocaleDateString('de-DE') : '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="vf-detail-tabs">
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="contracts">Verträge</TabsTrigger>
          <TabsTrigger value="payments">Zahlungen</TabsTrigger>
          <TabsTrigger value="documents">Dokumente</TabsTrigger>
          <TabsTrigger value="communication">Kommunikation</TabsTrigger>
        </TabsList>

        <div className="vf-detail-layout">
          <div className="vf-detail-main">
            <TabsContent value="overview">
              <div className="grid md:grid-cols-2 gap-6">
                <TenantProfileCard tenant={tenant} />
                <TenantScoring tenant={tenant} />
              </div>
            </TabsContent>

            <TabsContent value="contracts">
              <TenantContractsOverview tenantId={tenantId} />
            </TabsContent>

            <TabsContent value="payments">
              <PaymentsList tenantId={tenantId} />
            </TabsContent>

            <TabsContent value="documents">
              <TenantDocumentsTab tenantId={tenantId} />
            </TabsContent>

            <TabsContent value="communication">
              <CommunicationsList tenantId={tenantId} />
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
}