import React, { useState } from 'react';
import { VfModal } from '@/components/shared/VfModal';
import { VfSelect } from '@/components/shared/VfSelect';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

export default function EnergyPassportUploadDialog({ open, onClose, buildingId }) {
  const [file, setFile] = useState(null);

  return (
    <VfModal
      open={open}
      onOpenChange={onClose}
      title="Energieausweis hochladen"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Abbrechen</Button>
          <Button variant="gradient">
            <Upload className="h-4 w-4 mr-2" />
            Hochladen
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <VfSelect
          label="Typ"
          options={[
            { value: 'demand', label: 'Bedarfsausweis' },
            { value: 'consumption', label: 'Verbrauchsausweis' }
          ]}
        />

        <div className="border-2 border-dashed border-[var(--theme-border)] rounded-lg p-8 text-center">
          <Upload className="h-12 w-12 mx-auto mb-4 text-[var(--theme-text-muted)]" />
          <p className="text-sm text-[var(--theme-text-secondary)] mb-2">
            Datei hier ablegen oder klicken
          </p>
          <input type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
          <Button variant="outline" size="sm">Datei auswählen</Button>
        </div>
      </div>
    </VfModal>
  );
}