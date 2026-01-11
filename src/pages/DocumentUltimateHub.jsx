import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DocumentAssembly from '@/components/documents/DocumentAssembly';
import DocumentComments from '@/components/documents/DocumentComments';
import CustomMetadataManager from '@/components/documents/CustomMetadataManager';
import LifecyclePredictions from '@/components/documents/LifecyclePredictions';

export default function DocumentUltimateHub() {
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
        <h1 className="text-3xl font-bold">Document Ultimate Hub</h1>
        <p className="text-slate-600 mt-1">
          Assembly, Collaboration, Custom Fields, Lifecycle & API
        </p>
      </div>

      <Tabs defaultValue="assembly" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="assembly">Assembly</TabsTrigger>
          <TabsTrigger value="comments">Kommentare</TabsTrigger>
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
          <TabsTrigger value="lifecycle">Lifecycle</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
        </TabsList>

        <TabsContent value="assembly">
          <DocumentAssembly companyId={companyId} />
        </TabsContent>

        <TabsContent value="comments">
          {firstDocId ? (
            <DocumentComments documentId={firstDocId} companyId={companyId} />
          ) : (
            <div className="text-center py-12 text-slate-600">
              Keine Dokumente gefunden
            </div>
          )}
        </TabsContent>

        <TabsContent value="metadata">
          <CustomMetadataManager companyId={companyId} />
        </TabsContent>

        <TabsContent value="lifecycle">
          <LifecyclePredictions companyId={companyId} />
        </TabsContent>

        <TabsContent value="api">
          <div className="space-y-4">
            <div className="bg-slate-900 text-white p-4 rounded-lg font-mono text-xs">
              <p className="text-green-400 mb-2"># API Endpoints:</p>
              <p>GET    /api/documents</p>
              <p>GET    /api/documents/:id</p>
              <p>POST   /api/documents</p>
              <p>PUT    /api/documents/:id</p>
              <p>DELETE /api/documents/:id</p>
              <p className="text-green-400 mt-4 mb-2"># Authentication:</p>
              <p>Header: X-API-Key: YOUR_API_KEY</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}