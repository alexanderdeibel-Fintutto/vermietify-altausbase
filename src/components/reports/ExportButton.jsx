import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export default function ExportButton({ data, filename = 'export' }) {
  const handleExport = () => {
    const csv = convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const convertToCSV = (data) => {
    if (!data || data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const rows = data.map(item => headers.map(h => item[h]).join(','));
    return [headers.join(','), ...rows].join('\n');
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport}>
      <Download className="h-4 w-4 mr-2" />
      Exportieren
    </Button>
  );
}