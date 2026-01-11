import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DocumentLockManager from '@/components/documents/DocumentLockManager';
import DigitalRightsManager from '@/components/documents/DigitalRightsManager';
import TenantIsolationDashboard from '@/components/documents/TenantIsolationDashboard';
import WatermarkTool from '@/components/documents/WatermarkTool';
import RedactionTool from '@/components/documents/RedactionTool';
import EncryptionManager from '@/components/documents/EncryptionManager';
import DLPScanner from '@/components/documents/DLPScanner';
import DLPRuleManager from '@/components/documents/DLPRuleManager';
import CloudIntegrationHub from '@/components/documents/CloudIntegrationHub';
import { Card } from '@/components/ui/card';

export default function DocumentSecurityHub() {
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

  const { data: documents = [] } = useQuery({
    queryKey: ['documents-list', building?.company_id],
    queryFn: async () => {
      if (!building?.company_id) return [];
      const docs = await base44.asServiceRole.entities.Document.filter({
        company_id: building.company_id
      }, '-created_date', 1);
      return docs;
    },
    enabled: !!building?.company_id
  });

  const companyId = building?.company_id || user?.company_id;
  const firstDocId = documents[0]?.id;

  if (!companyId) return <div className="text-center py-12">Lade Daten...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Document Security Hub</h1>
        <p className="text-slate-600 mt-1">
          Locking, DRM, E2E Encryption, Redaction, DLP & Multi-Tenant Isolation
        </p>
      </div>

      <Tabs defaultValue="locking" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="locking">Locking</TabsTrigger>
          <TabsTrigger value="drm">DRM</TabsTrigger>
          <TabsTrigger value="watermark">Watermark</TabsTrigger>
          <TabsTrigger value="redaction">Redaction</TabsTrigger>
          <TabsTrigger value="encryption">E2E</TabsTrigger>
          <TabsTrigger value="dlp">DLP</TabsTrigger>
          <TabsTrigger value="cloud">Cloud</TabsTrigger>
          <TabsTrigger value="tenant">Tenant</TabsTrigger>
        </TabsList>

        <TabsContent value="locking">
          {firstDocId ? (
            <DocumentLockManager documentId={firstDocId} companyId={companyId} />
          ) : (
            <Card className="text-center py-12">
              <p className="text-slate-600">Keine Dokumente gefunden</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="drm">
          {firstDocId ? (
            <DigitalRightsManager documentId={firstDocId} companyId={companyId} />
          ) : (
            <Card className="text-center py-12">
              <p className="text-slate-600">Keine Dokumente gefunden</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="watermark">
          {firstDocId ? (
            <WatermarkTool documentId={firstDocId} />
          ) : (
            <Card className="text-center py-12">
              <p className="text-slate-600">Keine Dokumente gefunden</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="redaction">
          {firstDocId ? (
            <RedactionTool documentId={firstDocId} />
          ) : (
            <Card className="text-center py-12">
              <p className="text-slate-600">Keine Dokumente gefunden</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="encryption">
          {firstDocId ? (
            <EncryptionManager documentId={firstDocId} companyId={companyId} />
          ) : (
            <Card className="text-center py-12">
              <p className="text-slate-600">Keine Dokumente gefunden</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="dlp">
          <div className="grid gap-4 md:grid-cols-2">
            <DLPRuleManager companyId={companyId} />
            {firstDocId && <DLPScanner documentId={firstDocId} companyId={companyId} />}
          </div>
        </TabsContent>

        <TabsContent value="cloud">
          <CloudIntegrationHub companyId={companyId} />
        </TabsContent>

        <TabsContent value="tenant">
          {user?.role === 'admin' ? (
            <TenantIsolationDashboard tenantId={companyId} />
          ) : (
            <Card className="text-center py-12">
              <p className="text-slate-600">Admin-Zugriff erforderlich</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}