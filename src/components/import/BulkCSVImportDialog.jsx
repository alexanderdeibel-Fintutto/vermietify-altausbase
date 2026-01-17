import React, { useState } from 'react';
import { VfModal } from '@/components/shared/VfModal';
import DragDropZone from '@/components/shared/DragDropZone';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { VfSelect } from '@/components/shared/VfSelect';

export default function BulkCSVImportDialog({ open, onClose, onImport }) {
  const [file, setFile] = useState(null);
  const [entityType, setEntityType] = useState('tenants');

  return (
    <VfModal
      open={open}
      onOpenChange={onClose}
      title="CSV-Import"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Abbrechen</Button>
          <Button 
            variant="gradient"
            onClick={() => onImport({ file, entityType })}
            disabled={!file}
          >
            <Upload className="h-4 w-4 mr-2" />
            Importieren
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <VfSelect
          label="Datentyp"
          value={entityType}
          onChange={setEntityType}
          options={[
            { value: 'tenants', label: 'Mieter' },
            { value: 'buildings', label: 'Objekte' },
            { value: 'units', label: 'Einheiten' },
            { value: 'invoices', label: 'Rechnungen' }
          ]}
        />

        <DragDropZone
          onDrop={(files) => setFile(files[0])}
          accept=".csv"
        />

        {file && (
          <div className="p-3 bg-[var(--theme-surface)] rounded-lg flex items-center gap-3">
            <FileSpreadsheet className="h-5 w-5 text-[var(--theme-primary)]" />
            <div>
              <div className="text-sm font-medium">{file.name}</div>
              <div className="text-xs text-[var(--theme-text-muted)]">
                {(file.size / 1024).toFixed(2)} KB
              </div>
            </div>
          </div>
        )}
      </div>
    </VfModal>
  );
}