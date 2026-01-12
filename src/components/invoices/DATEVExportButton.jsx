import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';

export default function DATEVExportButton({ buildingId, startDate, endDate }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!buildingId || !startDate || !endDate) {
      alert('Bitte füllen Sie alle Felder aus');
      return;
    }

    setExporting(true);
    try {
      const response = await base44.functions.invoke('exportToDATV', {
        buildingId,
        startDate,
        endDate
      });

      // Download the file
      const link = document.createElement('a');
      link.href = response.data.fileUrl;
      link.download = `DATEV-Export-${buildingId}-${startDate}-${endDate}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert(`✅ ${response.data.bookingsExported} Buchungen + ${response.data.paymentsExported} Zahlungen exportiert`);
    } catch (error) {
      alert('Fehler beim Export: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={exporting}
      variant="outline"
      className="gap-2"
    >
      {exporting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Exportiere...
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          DATEV Export
        </>
      )}
    </Button>
  );
}