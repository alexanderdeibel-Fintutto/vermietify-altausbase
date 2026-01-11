import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GoogleDriveSyncPanel from '@/components/documents/GoogleDriveSyncPanel';
import DocumentExpiryTracker from '@/components/documents/DocumentExpiryTracker';
import MobileDocumentScanner from '@/components/documents/MobileDocumentScanner';
import DocumentComparisonTool from '@/components/documents/DocumentComparisonTool';
import DocumentRelationshipGraph from '@/components/documents/DocumentRelationshipGraph';
import SmartSuggestionsPanel from '@/components/documents/SmartSuggestionsPanel';

export default function DocumentEnterpriseHub() {
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
        <h1 className="text-3xl font-bold">Dokumenten Enterprise Hub</h1>
        <p className="text-slate-600 mt-1">
          Cloud-Sync, Mobile-Scan, Expiry-Tracking, Vergleich & AI-Beziehungen
        </p>
      </div>

      <Tabs defaultValue="cloud" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="cloud">Cloud</TabsTrigger>
          <TabsTrigger value="scanner">Scanner</TabsTrigger>
          <TabsTrigger value="expiry">Ablauf</TabsTrigger>
          <TabsTrigger value="compare">Vergleich</TabsTrigger>
          <TabsTrigger value="relations">Beziehungen</TabsTrigger>
          <TabsTrigger value="ai">AI-Tipps</TabsTrigger>
        </TabsList>

        <TabsContent value="cloud" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GoogleDriveSyncPanel companyId={companyId} />
            
            {/* OneDrive Placeholder */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 text-center">
              <p className="text-sm font-medium text-blue-900">OneDrive Integration</p>
              <p className="text-xs text-blue-700 mt-1">Bald verfügbar</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="scanner">
          <MobileDocumentScanner companyId={companyId} />
        </TabsContent>

        <TabsContent value="expiry">
          <DocumentExpiryTracker companyId={companyId} />
        </TabsContent>

        <TabsContent value="compare">
          <DocumentComparisonTool companyId={companyId} />
        </TabsContent>

        <TabsContent value="relations">
          {firstDocId ? (
            <DocumentRelationshipGraph documentId={firstDocId} companyId={companyId} />
          ) : (
            <div className="text-center py-12 text-slate-600">
              Keine Dokumente gefunden
            </div>
          )}
        </TabsContent>

        <TabsContent value="ai">
          {firstDocId ? (
            <SmartSuggestionsPanel documentId={firstDocId} companyId={companyId} />
          ) : (
            <div className="text-center py-12 text-slate-600">
              Keine Dokumente gefunden
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}