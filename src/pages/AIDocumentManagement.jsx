import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Upload, Search, Database } from 'lucide-react';
import AIDocumentUploader from '@/components/documents/AIDocumentUploader';
import AIDocumentSearch from '@/components/documents/AIDocumentSearch';
import AIDataExtractor from '@/components/documents/AIDataExtractor';

export default function AIDocumentManagement() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Building.filter({ created_by: user.email });
    },
    enabled: !!user?.email
  });

  const companyId = buildings[0]?.company_id;
  const buildingId = buildings[0]?.id;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-purple-600" />
          KI-Dokumentenverwaltung
        </h1>
        <p className="text-slate-600 mt-1">
          Intelligente Dokumentenanalyse, -suche und Datenextraktion
        </p>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload & Kategorisierung
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Intelligente Suche
          </TabsTrigger>
          <TabsTrigger value="extract" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Datenextraktion
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-4">
          <AIDocumentUploader companyId={companyId} buildingId={buildingId} />
        </TabsContent>

        <TabsContent value="search" className="mt-4">
          <AIDocumentSearch />
        </TabsContent>

        <TabsContent value="extract" className="mt-4">
          <AIDataExtractor companyId={companyId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}