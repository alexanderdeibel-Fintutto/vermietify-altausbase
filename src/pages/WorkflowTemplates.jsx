import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WorkflowTemplateLibrary from '@/components/workflows/WorkflowTemplateLibrary';
import { Library, Bookmark } from 'lucide-react';

export default function WorkflowTemplates() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: building } = useQuery({
    queryKey: ['user-building', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const buildings = await base44.asServiceRole.entities.Building.filter({});
      return buildings[0];
    },
    enabled: !!user?.email
  });

  const companyId = building?.id || user?.company_id;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Library className="w-8 h-8" />
          Workflow-Template-Katalog
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Durchsuchen und verwenden Sie vordefinierte Workflow-Vorlagen
        </p>
      </div>

      <Tabs defaultValue="catalog" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="catalog" className="gap-2">
            <Library className="w-4 h-4" />
            <span className="hidden sm:inline">Katalog</span>
          </TabsTrigger>
          <TabsTrigger value="my-templates" className="gap-2">
            <Bookmark className="w-4 h-4" />
            <span className="hidden sm:inline">Meine Templates</span>
          </TabsTrigger>
        </TabsList>

        {companyId && (
          <>
            <TabsContent value="catalog" className="mt-4">
              <WorkflowTemplateLibrary companyId={companyId} />
            </TabsContent>

            <TabsContent value="my-templates" className="mt-4">
              <WorkflowTemplateLibrary 
                companyId={companyId}
              />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}