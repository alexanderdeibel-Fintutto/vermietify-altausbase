import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Download, Eye } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function PDFPreviewDialog({ submission, open, onOpenChange }) {
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);

  useEffect(() => {
    if (open && submission && !pdfUrl) {
      generatePreview();
    }
  }, [open, submission]);

  const generatePreview = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('exportTaxFormPDF', {
        submission_id: submission.id,
        include_watermark: true
      });

      if (response.data.success) {
        // Erstelle Blob URL
        const blob = new Blob([response.data.pdf_data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        setPdfUrl(url);
      }
    } catch (error) {
      toast.error('PDF-Vorschau konnte nicht geladen werden');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!pdfUrl) return;
    
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `${submission.tax_form_type}_${submission.tax_year}_preview.pdf`;
    a.click();
    toast.success('PDF heruntergeladen');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>PDF-Vorschau</span>
            <Button onClick={handleDownload} disabled={!pdfUrl} size="sm">
              <Download className="w-4 h-4 mr-2" />
              Herunterladen
            </Button>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3">PDF wird erstellt...</span>
          </div>
        ) : pdfUrl ? (
          <div className="border rounded-lg overflow-hidden">
            <iframe
              src={pdfUrl}
              className="w-full h-[70vh]"
              title="PDF Preview"
            />
          </div>
        ) : (
          <Alert>
            <AlertDescription>
              PDF-Vorschau konnte nicht geladen werden
            </AlertDescription>
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
}