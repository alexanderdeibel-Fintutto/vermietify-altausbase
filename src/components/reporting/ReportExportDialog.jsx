import React, { useState } from 'react';
import { VfModal } from '@/components/shared/VfModal';
import { VfRadio } from '@/components/shared/VfRadio';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';

export default function ReportExportDialog({ open, onClose, reportData, reportName }) {
  const [format, setFormat] = useState('pdf');

  const exportMutation = useMutation({
    mutationFn: async (format) => {
      const response = await base44.functions.invoke('exportReportToFile', {
        report_data: reportData,
        report_name: reportName,
        format
      });

      const mimeTypes = {
        pdf: 'application/pdf',
        csv: 'text/csv',
        excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      };

      const blob = new Blob([response.data], { type: mimeTypes[format] });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportName}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      onClose();
    }
  });

  return (
    <VfModal
      open={open}
      onOpenChange={onClose}
      title="Bericht exportieren"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Abbrechen</Button>
          <Button 
            variant="gradient"
            onClick={() => exportMutation.mutate(format)}
            disabled={exportMutation.isPending}
          >
            <Download className="h-4 w-4 mr-2" />
            {exportMutation.isPending ? 'Exportiere...' : 'Exportieren'}
          </Button>
        </>
      }
    >
      <VfRadio
        label="Format wählen"
        value={format}
        onValueChange={setFormat}
        options={[
          { value: 'pdf', label: 'PDF-Dokument' },
          { value: 'csv', label: 'CSV-Datei' },
          { value: 'excel', label: 'Excel-Datei' }
        ]}
      />
    </VfModal>
  );
}