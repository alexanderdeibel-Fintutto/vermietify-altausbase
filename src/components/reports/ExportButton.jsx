import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, Sheet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ExportButton({ reportType, reportData, className = "" }) {
  const [exporting, setExporting] = useState(false);

  const exportToPDF = async () => {
    setExporting(true);
    try {
      const response = await base44.functions.invoke('exportReportToPDF', {
        reportType,
        reportData
      });
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      
      toast.success('PDF erfolgreich exportiert');
    } catch (error) {
      toast.error('Fehler beim PDF-Export');
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  const exportToExcel = async () => {
    setExporting(true);
    try {
      const response = await base44.functions.invoke('exportReportToExcel', {
        reportType,
        reportData
      });
      
      // Create blob and download
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      
      toast.success('Excel erfolgreich exportiert');
    } catch (error) {
      toast.error('Fehler beim Excel-Export');
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={className} disabled={exporting}>
          {exporting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={exportToPDF} disabled={exporting}>
          <FileText className="w-4 h-4 mr-2" />
          PDF exportieren
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToExcel} disabled={exporting}>
          <Sheet className="w-4 h-4 mr-2" />
          Excel exportieren
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}