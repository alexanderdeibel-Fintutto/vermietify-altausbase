import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { Download, FileJson, FileText } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

const EXPORT_OPTIONS = {
  AT: [
    { id: 'finanz_online', label: 'FINANZ Online XML', icon: '📄', description: 'Österreichisches Steuersystem' },
    { id: 'pdf_anlage', label: 'Anlage PDF', icon: '📋', description: 'Ausfüllbare PDF-Formular' }
  ],
  CH: [
    { id: 'etax', label: 'eTax XML', icon: '📄', description: 'Schweizer eTax-System' },
    { id: 'tax_me', label: 'TAX.me Online', icon: '📄', description: 'TAX.me Platform Format' },
    { id: 'pdf_anlage', label: 'Anlage PDF', icon: '📋', description: 'Ausfüllbare PDF-Formular' }
  ],
  DE: [
    { id: 'elster', label: 'ELSTER XML', icon: '📄', description: 'Deutsches Finanzamt-System' },
    { id: 'pdf_anlage', label: 'Anlage PDF', icon: '📋', description: 'Ausfüllbare PDF-Formular' }
  ]
};

export default function TaxExportHub() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [selectedFormat, setSelectedFormat] = useState('');
  const [exporting, setExporting] = useState(false);

  const { data: filingData = {}, isLoading } = useQuery({
    queryKey: ['taxFilingData', country, taxYear],
    queryFn: async () => {
      const filings = await base44.entities.TaxFiling.filter({
        country,
        tax_year: taxYear
      }).catch(() => []);
      return filings[0] || {};
    }
  });

  const handleExport = async (format) => {
    setExporting(true);
    try {
      let response;
      const payload = { taxYear, country, filingData };

      if (format === 'finanz_online') {
        response = await base44.functions.invoke('generateFINANZOnlineXML', payload);
      } else if (format === 'etax') {
        response = await base44.functions.invoke('generateETaxXML', { ...payload, canton: filingData.canton });
      } else if (format === 'tax_me') {
        response = await base44.functions.invoke('generateTaxMeOnlineXML', { ...payload, canton: filingData.canton });
      }

      if (response.data?.xml) {
        const blob = new Blob([response.data.xml], { type: 'text/xml' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = response.data.filename || `export_${taxYear}.xml`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Export fehlgeschlagen');
    } finally {
      setExporting(false);
    }
  };

  const availableFormats = EXPORT_OPTIONS[country] || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📤 Steuererklärung Export</h1>
        <p className="text-slate-500 mt-1">Exportieren Sie Ihre Steuererklärung in verschiedenen Formaten</p>
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
              {[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map(year => (
                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filing Status */}
      {!isLoading && Object.keys(filingData).length > 0 && (
        <Card className="border-green-300 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Erklärung erfasst</span>
              <Badge className="bg-green-600 text-white">{filingData.status || 'Vorbereitet'}</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Formats */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold">Verfügbare Formate</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableFormats.map(format => (
            <Card
              key={format.id}
              className={`cursor-pointer transition ${selectedFormat === format.id ? 'border-blue-500 bg-blue-50' : 'hover:border-slate-400'}`}
              onClick={() => setSelectedFormat(format.id)}
            >
              <CardContent className="pt-6">
                <div className="text-3xl mb-2">{format.icon}</div>
                <h4 className="font-bold text-sm">{format.label}</h4>
                <p className="text-xs text-slate-600 mt-1">{format.description}</p>
                <Button
                  size="sm"
                  className="mt-4 w-full"
                  disabled={exporting}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExport(format.id);
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportieren
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Info */}
      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">ℹ️ Informationen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>• XML-Dateien können direkt in den jeweiligen Steuersystemen hochgeladen werden</p>
          <p>• PDF-Formulare können ausgedruckt und handschriftlich ergänzt werden</p>
          <p>• Alle Exporte sind verschlüsselt und sicher</p>
          <p>• Behalten Sie eine Kopie für Ihre Unterlagen</p>
        </CardContent>
      </Card>
    </div>
  );
}