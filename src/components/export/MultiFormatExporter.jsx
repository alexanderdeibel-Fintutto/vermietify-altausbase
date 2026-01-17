import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Download, FileText, Table } from 'lucide-react';

export default function MultiFormatExporter({ 
  data, 
  filename,
  onExportPDF,
  onExportCSV,
  onExportExcel 
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportieren
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onExportPDF && (
          <DropdownMenuItem onClick={onExportPDF}>
            <FileText className="h-4 w-4 mr-2" />
            Als PDF
          </DropdownMenuItem>
        )}
        {onExportCSV && (
          <DropdownMenuItem onClick={onExportCSV}>
            <Table className="h-4 w-4 mr-2" />
            Als CSV
          </DropdownMenuItem>
        )}
        {onExportExcel && (
          <DropdownMenuItem onClick={onExportExcel}>
            <Table className="h-4 w-4 mr-2" />
            Als Excel
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}