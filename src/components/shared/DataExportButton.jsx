import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function DataExportButton({ 
  data = [],
  filename = 'export',
  formats = ['csv', 'json', 'xlsx']
}) {
  const [exporting, setExporting] = useState(false);

  const exportToCSV = () => {
    setExporting(true);
    try {
      const csv = [
        Object.keys(data[0] || {}).join(','),
        ...data.map(row =>
          Object.values(row)
            .map(v => `"${String(v).replace(/"/g, '""')}"`)
            .join(',')
        )
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      downloadFile(blob, `${filename}.csv`);
    } finally {
      setExporting(false);
    }
  };

  const exportToJSON = () => {
    setExporting(true);
    try {
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      downloadFile(blob, `${filename}.json`);
    } finally {
      setExporting(false);
    }
  };

  const downloadFile = (blob, name) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          className="gap-2 bg-slate-700 hover:bg-slate-800"
          disabled={exporting}
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Exportieren</span>
          {exporting && <span className="ml-1 animate-spin">⋯</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {formats.includes('csv') && (
          <DropdownMenuItem onClick={exportToCSV}>
            CSV exportieren
          </DropdownMenuItem>
        )}
        {formats.includes('json') && (
          <DropdownMenuItem onClick={exportToJSON}>
            JSON exportieren
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}