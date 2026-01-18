import React, { useState } from 'react';
import { VfModal } from '@/components/shared/VfModal';
import { VfSelect } from '@/components/shared/VfSelect';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export default function MultiFormatExporter({ open, onClose, data }) {
  const [format, setFormat] = useState('csv');

  const handleExport = () => {
    console.log('Exporting as:', format);
    onClose();
  };

  return (
    <VfModal
      open={open}
      onOpenChange={onClose}
      title="Daten exportieren"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Abbrechen</Button>
          <Button variant="gradient" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportieren
          </Button>
        </>
      }
    >
      <VfSelect
        label="Format"
        value={format}
        onChange={setFormat}
        options={[
          { value: 'csv', label: 'CSV' },
          { value: 'excel', label: 'Excel' },
          { value: 'pdf', label: 'PDF' },
          { value: 'json', label: 'JSON' }
        ]}
      />
    </VfModal>
  );
}