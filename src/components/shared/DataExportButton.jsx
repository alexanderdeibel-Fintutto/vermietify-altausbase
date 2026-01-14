import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText, FileJson, Loader2 } from 'lucide-react';

export default function DataExportButton({ 
  data = [],
  filename = 'export',
  columns = [],
  variant = 'outline',
  size = 'default'
}) {
  const [exporting, setExporting] = useState(false);

  const exportToCSV = () => {
    if (data.length === 0) return;

    setExporting(true);
    try {
      const headers = columns.length > 0 ? columns : Object.keys(data[0]);
      const csvContent = [
        headers.join(';'),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header] || '';
            return typeof value === 'string' && value.includes(';') 
              ? `"${value}"` 
              : value;
          }).join(';')
        )
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      downloadFile(blob, `${filename}.csv`);
    } finally {
      setExporting(false);
    }
  };

  const exportToJSON = () => {
    if (data.length === 0) return;

    setExporting(true);
    try {
      const jsonContent = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      downloadFile(blob, `${filename}.json`);
    } finally {
      setExporting(false);
    }
  };

  const exportToExcel = () => {
    if (data.length === 0) return;

    setExporting(true);
    try {
      // Simple Excel XML format
      const headers = columns.length > 0 ? columns : Object.keys(data[0]);
      let excelContent = '<?xml version="1.0"?>\n';
      excelContent += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet">\n';
      excelContent += '<Worksheet ss:Name="Sheet1">\n<Table>\n';
      
      // Header row
      excelContent += '<Row>\n';
      headers.forEach(header => {
        excelContent += `<Cell><Data ss:Type="String">${header}</Data></Cell>\n`;
      });
      excelContent += '</Row>\n';
      
      // Data rows
      data.forEach(row => {
        excelContent += '<Row>\n';
        headers.forEach(header => {
          const value = row[header] || '';
          const type = typeof value === 'number' ? 'Number' : 'String';
          excelContent += `<Cell><Data ss:Type="${type}">${value}</Data></Cell>\n`;
        });
        excelContent += '</Row>\n';
      });
      
      excelContent += '</Table>\n</Worksheet>\n</Workbook>';
      
      const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
      downloadFile(blob, `${filename}.xls`);
    } finally {
      setExporting(false);
    }
  };

  const downloadFile = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={exporting || data.length === 0}>
          {exporting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Exportieren
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Format auswählen</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={exportToCSV}>
          <FileText className="w-4 h-4 mr-2" />
          CSV-Datei
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToExcel}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Excel-Datei
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToJSON}>
          <FileJson className="w-4 h-4 mr-2" />
          JSON-Datei
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}