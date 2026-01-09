import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Download, CheckCircle2, Loader2 } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function TaxReportExport() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [exportedFiles, setExportedFiles] = useState([]);

  // Export PDF mutation
  const { mutate: exportPDF, isLoading: isExportingPDF } = useMutation({
    mutationFn: () =>
      base44.functions.invoke('exportTaxReportPDF', { country, taxYear }),
    onSuccess: (response) => {
      const file = {
        id: Date.now(),
        name: `tax-report-${country}-${taxYear}.pdf`,
        url: response.data?.file_url,
        type: 'pdf',
        timestamp: new Date()
      };
      setExportedFiles(prev => [file, ...prev]);
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📄 Tax Report Export</h1>
        <p className="text-slate-500 mt-1">Exportieren Sie Ihre Steuerberichte als PDF oder Excel</p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Land</label>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AT">🇦🇹 Österreich</SelectItem>
              <SelectItem value="CH">🇨🇭 Schweiz</SelectItem>
              <SelectItem value="DE">🇩🇪 Deutschland</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Steuerjahr</label>
          <Select value={String(taxYear)} onValueChange={(v) => setTaxYear(parseInt(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={String(CURRENT_YEAR - 1)}>{CURRENT_YEAR - 1}</SelectItem>
              <SelectItem value={String(CURRENT_YEAR)}>{CURRENT_YEAR}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Export Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-blue-300 bg-blue-50 cursor-pointer hover:shadow-md transition">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              📄 PDF Export
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-700">Professioneller PDF-Bericht mit allen Tax-Daten</p>
            <Button
              onClick={() => exportPDF()}
              disabled={isExportingPDF}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isExportingPDF ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Exportiere...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  PDF Exportieren
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-green-300 bg-green-50">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              📊 Excel Export
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-700">Detaillierte Tabellenkalkulationsdatei</p>
            <Button disabled className="w-full" variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Bald verfügbar
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Export History */}
      {exportedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">📥 Export-Verlauf</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-64 overflow-y-auto">
            {exportedFiles.map(file => (
              <div key={file.id} className="flex justify-between items-center p-3 bg-slate-50 rounded border border-slate-200">
                <div className="flex-1">
                  <p className="font-medium text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {file.timestamp.toLocaleString('de-DE')}
                  </p>
                </div>
                {file.url && (
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    ⬇️ Laden
                  </a>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <Alert className="border-blue-300 bg-blue-50">
        <AlertDescription className="text-blue-900 text-sm">
          <strong>💡 Tipps:</strong> Exportieren Sie Ihre Berichte regelmäßig zur Archivierung und teilen Sie sie mit Ihrem Steuerberater.
        </AlertDescription>
      </Alert>
    </div>
  );
}