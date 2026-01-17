import React, { useState } from 'react';
import { VfModal } from '@/components/shared/VfModal';
import DragDropZone from '@/components/shared/DragDropZone';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, FileText } from 'lucide-react';

export default function EnergyPassportUploadDialog({ open, onClose, buildingId }) {
  const [file, setFile] = useState(null);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      await base44.entities.EnergyPassport.create({
        building_id: buildingId,
        file_url,
        issue_date: new Date().toISOString().split('T')[0],
        valid_until: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['energy-passport', buildingId]);
      onClose();
    }
  });

  return (
    <VfModal
      open={open}
      onOpenChange={onClose}
      title="Energieausweis hochladen"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Abbrechen</Button>
          <Button 
            variant="gradient"
            onClick={() => uploadMutation.mutate(file)}
            disabled={!file || uploadMutation.isPending}
          >
            <Upload className="h-4 w-4 mr-2" />
            Hochladen
          </Button>
        </>
      }
    >
      <DragDropZone
        onDrop={(files) => setFile(files[0])}
        accept=".pdf"
      />
      {file && (
        <div className="mt-4 p-3 bg-[var(--theme-surface)] rounded-lg flex items-center gap-3">
          <FileText className="h-5 w-5 text-[var(--theme-primary)]" />
          <div>
            <div className="text-sm font-medium">{file.name}</div>
            <div className="text-xs text-[var(--theme-text-muted)]">
              {(file.size / 1024).toFixed(2)} KB
            </div>
          </div>
        </div>
      )}
    </VfModal>
  );
}