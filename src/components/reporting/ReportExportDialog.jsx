import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { Loader2, Download, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function ReportExportDialog({ reportData, reportType, title, onClose }) {
  const [exporting, setExporting] = useState(false);
  const [format, setFormat] = useState('pdf');

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await base44.functions.invoke('exportReportToPDF', {
        reportData,
        reportType,
        title
      });

      if (format === 'pdf') {
        // Konvertiere HTML zu PDF und downloade
        const blob = new Blob([response.data.html], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title.replace(/\s+/g, '_')}.html`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        
        toast.success('Report exportiert');
      }
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card className="bg-white shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg">Report exportieren</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700">Format</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="w-full mt-2 border rounded-lg px-4 py-2 text-sm"
          >
            <option value="pdf">PDF</option>
            <option value="csv">CSV</option>
            <option value="excel">Excel</option>
            <option value="email">Per Email</option>
          </select>
        </div>

        {format === 'email' && (
          <div>
            <label className="text-sm font-medium text-slate-700">Email-Empfänger</label>
            <input
              type="email"
              placeholder="email@example.com"
              className="w-full mt-2 border rounded-lg px-4 py-2 text-sm"
            />
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleExport}
            disabled={exporting}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {exporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Wird exportiert...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Exportieren
              </>
            )}
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Abbrechen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}