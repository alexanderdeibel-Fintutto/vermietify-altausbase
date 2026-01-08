import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function BatchPDFGenerator({ selectedSubmissions = [] }) {
  const [generating, setGenerating] = useState(false);

  const generateBatchPDFs = async () => {
    if (selectedSubmissions.length === 0) {
      toast.error('Keine Submissions ausgewählt');
      return;
    }

    setGenerating(true);
    try {
      const response = await base44.functions.invoke('batchGeneratePDFs', {
        submission_ids: selectedSubmissions
      });

      if (response.data.success) {
        toast.success(`${response.data.results.success} PDFs generiert`);
      }
    } catch (error) {
      toast.error('PDF-Generierung fehlgeschlagen');
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Batch-PDF-Export
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-slate-600">
          {selectedSubmissions.length} Submissions ausgewählt
        </div>
        <Button
          onClick={generateBatchPDFs}
          disabled={generating || selectedSubmissions.length === 0}
          className="w-full"
        >
          <Download className="w-4 h-4 mr-2" />
          {generating ? 'Generiere PDFs...' : 'Alle PDFs generieren'}
        </Button>
      </CardContent>
    </Card>
  );
}