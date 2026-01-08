import React from 'react';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Download, FileJson, FileCode, FileSpreadsheet } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function QuickExportMenu({ submissionId }) {
  const handleExport = async (format) => {
    try {
      const response = await base44.functions.invoke('exportSubmissionBundle', {
        submission_id: submissionId,
        format
      });

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `elster_export_${Date.now()}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const blob = new Blob([response.data], { 
          type: format === 'xml' ? 'application/xml' : 'text/csv' 
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `elster_export_${Date.now()}.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
      }

      toast.success(`Als ${format.toUpperCase()} exportiert`);
    } catch (error) {
      toast.error('Export fehlgeschlagen');
      console.error(error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Exportieren
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => handleExport('json')}>
          <FileJson className="w-4 h-4 mr-2" />
          JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('xml')}>
          <FileCode className="w-4 h-4 mr-2" />
          XML
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}