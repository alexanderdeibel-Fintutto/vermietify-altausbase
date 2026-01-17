import React, { useState } from 'react';
import { VfModal } from '@/components/shared/VfModal';
import DragDropZone from '@/components/shared/DragDropZone';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Upload, CheckCircle } from 'lucide-react';

export default function BulkCSVImportDialog({ open, onClose, entityName, onSuccess }) {
  const [file, setFile] = useState(null);

  const importMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const schema = await base44.entities[entityName].schema();
      
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: schema
      });

      if (result.status === 'success' && result.output) {
        await base44.entities[entityName].bulkCreate(result.output);
      }

      return result;
    },
    onSuccess: (result) => {
      onSuccess(result);
      setFile(null);
      onClose();
    }
  });

  return (
    <VfModal
      open={open}
      onOpenChange={onClose}
      title="CSV Import"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Abbrechen</Button>
          <Button 
            variant="gradient"
            onClick={() => importMutation.mutate(file)}
            disabled={!file || importMutation.isPending}
          >
            <Upload className="h-4 w-4 mr-2" />
            {importMutation.isPending ? 'Importiere...' : 'Importieren'}
          </Button>
        </>
      }
    >
      {importMutation.isSuccess ? (
        <div className="text-center py-8">
          <CheckCircle className="h-16 w-16 mx-auto mb-4 text-[var(--vf-success-500)]" />
          <p className="font-semibold">Import erfolgreich!</p>
        </div>
      ) : (
        <DragDropZone
          onDrop={(files) => setFile(files[0])}
          accept=".csv"
        />
      )}

      {file && !importMutation.isSuccess && (
        <div className="mt-4 p-3 bg-[var(--theme-surface)] rounded-lg">
          <p className="text-sm font-medium">{file.name}</p>
          <p className="text-xs text-[var(--theme-text-muted)]">
            {(file.size / 1024).toFixed(2)} KB
          </p>
        </div>
      )}
    </VfModal>
  );
}