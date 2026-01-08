import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function BulkPDFExportPanel({ selectedSubmissions }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (selectedSubmissions.length === 0) {
      toast.error('Keine Submissions ausgewählt');
      return;
    }

    setExporting(true);
    try {
      const response = await base44.functions.invoke('generateBulkPDFReports', {
        submission_ids: selectedSubmissions
      });

      if (response.data.success) {
        toast.success(`${response.data.generated_count} PDFs generiert`);
      }
    } catch (error) {
      toast.error('Export fehlgeschlagen');
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileDown className="w-5 h-5" />
          Bulk PDF Export
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-sm text-slate-600">
            {selectedSubmissions.length} Submissions ausgewählt
          </div>
          <Button 
            onClick={handleExport} 
            disabled={exporting || selectedSubmissions.length === 0}
            className="w-full"
          >
            {exporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exportiere...
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4 mr-2" />
                PDFs generieren
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}