import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import MultiFormatExporter from '@/components/export/MultiFormatExporter';

export default function BulkExportButton({ data }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Download className="h-4 w-4 mr-2" />
        Exportieren
      </Button>
      
      <MultiFormatExporter open={open} onClose={() => setOpen(false)} data={data} />
    </>
  );
}