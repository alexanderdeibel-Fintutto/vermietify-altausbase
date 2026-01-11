import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { ArrowLeft, Download, Trash2 } from 'lucide-react';

export default function TemplateVersionManager({ templateId, onBack }) {
  const [selectedVersion, setSelectedVersion] = useState(null);
  const queryClient = useQueryClient();

  const { data: versions = [] } = useQuery({
    queryKey: ['templateVersions', templateId],
    queryFn: async () => {
      const all = await base44.entities.DocumentTemplate.filter({
        previous_version_id: templateId
      });
      return all.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    enabled: !!templateId
  });

  const restoreMutation = useMutation({
    mutationFn: async (versionId) => {
      const version = versions.find(v => v.id === versionId);
      const current = await base44.entities.DocumentTemplate.list('-updated_date', 1);
      
      // Create new version record
      await base44.entities.DocumentTemplate.create({
        document_type: version.document_type,
        template_html: version.template_html,
        template_fields: version.template_fields,
        building_id: version.building_id,
        previous_version_id: current[0].id
      });
    },
    onSuccess: () => {
      toast.success('Version wiederhergestellt!');
      queryClient.invalidateQueries(['templateVersions']);
      queryClient.invalidateQueries(['documentTemplates']);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (versionId) => base44.entities.DocumentTemplate.delete(versionId),
    onSuccess: () => {
      toast.success('Version gelöscht!');
      queryClient.invalidateQueries(['templateVersions']);
    }
  });

  return (
    <div className="space-y-4">
      <Button onClick={onBack} variant="outline" className="gap-2">
        <ArrowLeft className="w-4 h-4" /> Zurück
      </Button>

      <h3 className="font-semibold text-lg">Versionshistorie</h3>

      {versions.length === 0 ? (
        <p className="text-slate-600">Keine älteren Versionen</p>
      ) : (
        <div className="space-y-2">
          {versions.map((version) => (
            <div key={version.id} className="p-3 border rounded-lg flex justify-between items-center">
              <div className="text-sm">
                <p className="font-medium">v{version.version}</p>
                <p className="text-xs text-slate-600">{new Date(version.created_date).toLocaleString('de-DE')}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => restoreMutation.mutate(version.id)}>
                  <Download className="w-4 h-4" /> Wiederherstellen
                </Button>
                <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(version.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}