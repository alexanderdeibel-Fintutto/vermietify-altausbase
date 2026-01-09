import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, FileJson, FileText, Database } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function TaxExportHub() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [format, setFormat] = useState('json');
  const [exporting, setExporting] = useState(false);

  const { data: exportData = {}, isLoading } = useQuery({
    queryKey: ['taxExport', country, taxYear, format],
    queryFn: async () => {
      const response = await base44.functions.invoke('exportTaxDataForFilings', {
        country,
        taxYear,
        format
      });
      return response.data?.export || {};
    },
    enabled: exporting
  });

  const getFormatIcon = (fmt) => {
    if (fmt === 'json') return <FileJson className="w-4 h-4" />;
    if (fmt === 'pdf') return <FileText className="w-4 h-4" />;
    return <Database className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📤 Steuer-Export Hub</h1>
        <p className="text-slate-500 mt-1">Exportieren Sie Ihre Steuerdaten in verschiedene Formate</p>
      </div>

      {/* Export Configuration */}
      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">Export-Einstellungen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Land</label>
              <Select value={country} onValueChange={setCountry} disabled={exporting}>
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
              <Select value={String(taxYear)} onValueChange={(v) => setTaxYear(parseInt(v))} disabled={exporting}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[CURRENT_YEAR - 1, CURRENT_YEAR].map(year => (
                    <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Format</label>
              <Select value={format} onValueChange={setFormat} disabled={exporting}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="xml">XML</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={() => setExporting(true)}
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={exporting}
          >
            <Download className="w-4 h-4 mr-2" />
            {exporting && isLoading ? 'Wird vorbereitet...' : 'Daten vorbereiten'}
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8">⏳ Export wird vorbereitet...</div>
      ) : exporting && exportData.content ? (
        <>
          {/* Export Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">📊 Export-Zusammenfassung</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-slate-600">Berechnungen</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {exportData.record_count?.calculations || 0}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Dokumente</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {exportData.record_count?.documents || 0}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Filings</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {exportData.record_count?.filings || 0}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Compliance</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {exportData.record_count?.compliance_items || 0}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Export Structure */}
          {(exportData.content.file_structure || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📁 Dateienstruktur</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {exportData.content.file_structure.map((file, i) => (
                    <li key={i} className="text-sm p-2 bg-slate-50 rounded flex gap-2">
                      {getFormatIcon(format)}
                      {file}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Validation Rules */}
          {(exportData.content.validation_rules || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">✓ Validierungsregeln</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {exportData.content.validation_rules.map((rule, i) => (
                  <div key={i} className="text-sm p-2 bg-green-50 rounded">
                    ✓ {rule}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Import Instructions */}
          {(exportData.content.import_instructions || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📖 Import-Anleitung</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {exportData.content.import_instructions.map((instruction, i) => (
                  <div key={i} className="text-sm p-2 bg-blue-50 rounded flex gap-2">
                    <span className="text-blue-600 font-bold flex-shrink-0">{i + 1}.</span>
                    {instruction}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Download Button */}
          <Button className="w-full bg-green-600 hover:bg-green-700">
            <Download className="w-4 h-4 mr-2" />
            Daten herunterladen ({format.toUpperCase()})
          </Button>
        </>
      ) : (
        <div className="text-center py-8 text-slate-500">
          Wählen Sie Format und Einstellungen aus, um Daten zu exportieren
        </div>
      )}
    </div>
  );
}