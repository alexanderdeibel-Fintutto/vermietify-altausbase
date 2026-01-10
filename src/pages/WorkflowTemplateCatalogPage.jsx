import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, BookOpen, Plus } from 'lucide-react';
import WorkflowTemplateCatalog from '@/components/workflows/WorkflowTemplateCatalog';
import CreateFromTemplateDialog from '@/components/workflows/CreateFromTemplateDialog';

export default function WorkflowTemplateCatalogPage() {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const queryClient = useQueryClient();

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

  const companyId = building?.company_id || user?.company_id;

  if (!companyId) {
    return <div className="text-center py-12">Lade Daten...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BookOpen className="w-8 h-8" />
          Workflow Template Katalog
        </h1>
        <p className="text-slate-600 mt-2">
          Durchsuchen, kategorisieren und verwenden Sie vordefinierte Workflow-Templates
        </p>
      </div>

      {/* Catalog */}
      <WorkflowTemplateCatalog
        companyId={companyId}
        onTemplateSelected={setSelectedTemplate}
      />

      {/* Create from Template Dialog */}
      {selectedTemplate && (
        <CreateFromTemplateDialog
          open={!!selectedTemplate}
          onOpenChange={(open) => !open && setSelectedTemplate(null)}
          template={selectedTemplate}
          companyId={companyId}
        />
      )}
    </div>
  );
}